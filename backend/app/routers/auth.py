from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..audit import write_audit
from ..face_utils import encode_face
from ..security import create_access_token, get_current_user, hash_password, verify_password
from ..utils import get_db, validate_password

router = APIRouter()
MAX_ATTEMPTS = 5
BLOCK_MINUTES = 15


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    validate_password(payload.password)
    if payload.role not in ("doctor", "patient"):
        raise HTTPException(status_code=422, detail="Public registration only supports Doctor or Patient")
    if crud.get_user_by_email(db, payload.email.lower()):
        raise HTTPException(status_code=409, detail="Email already registered")

    specialization = None
    if payload.role == "doctor":
        specialization = db.query(models.Specialization).filter(
            models.Specialization.name == (payload.specialization or "").strip(),
            models.Specialization.status == "active",
        ).first()
        if not specialization:
            raise HTTPException(status_code=422, detail="Select a valid specialization")

    questions = []
    face_bytes = None
    if payload.reset_method == "question":
        question_ids = [item.question_id for item in payload.security_answers]
        questions = db.query(models.SecurityQuestion).filter(
            models.SecurityQuestion.id.in_(question_ids),
            models.SecurityQuestion.status == "active",
        ).all()
        if len(questions) != 3:
            raise HTTPException(status_code=422, detail="Select three valid security questions")
    elif payload.reset_method == "face":
        try:
            face_bytes = encode_face(payload.face_image or "")
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error))

    try:
        user = models.User(
            username=payload.name.strip(),
            email=payload.email.lower(),
            password=hash_password(payload.password),
            role=payload.role,
            status="active",
            reset_method=payload.reset_method,
            reset_key=hash_password(payload.reset_key) if payload.reset_method == "key" and payload.reset_key else None,
        )
        db.add(user)
        db.flush()
        if payload.role == "doctor":
            db.add(models.Doctor(
                user_id=user.id,
                name=payload.name.strip(),
                specialization=specialization.name,
                specialization_id=specialization.id,
            ))
        else:
            db.add(models.Patient(
                user_id=user.id,
                name=payload.name.strip(),
                contact_number=(payload.contact_number or "").strip(),
            ))
        for item in payload.security_answers:
            db.add(models.UserSecurityAnswer(
                user_id=user.id,
                question_id=item.question_id,
                answer_hash=hash_password(item.answer.strip().casefold()),
            ))
        if face_bytes is not None:
            db.add(models.FaceEnrollment(user_id=user.id, face_image=face_bytes))
        write_audit(
            db, action_type="registration", description="New account registered",
            module="users", status="success", user=user, request=request, record_id=user.id,
        )
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration could not be completed")


@router.post("/login")
def login(payload: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email.lower())
    ip = request.client.host if request.client else None
    if not user or user.deleted_at or user.status != "active":
        write_audit(
            db, action_type="login", description="Login failed", module="authentication",
            status="failed", request=request, failure_reason="Invalid credentials",
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    now = datetime.utcnow()
    if user.blocked_until and user.blocked_until > now:
        raise HTTPException(status_code=403, detail="Account is temporarily locked")
    if user.blocked_until and user.blocked_until <= now:
        user.blocked_until = None

    if not verify_password(payload.password, user.password):
        db.add(models.LoginAttempt(user_id=user.id, email=user.email, ip_address=ip, success=False))
        recent = db.query(models.LoginAttempt).filter(
            models.LoginAttempt.user_id == user.id,
            models.LoginAttempt.success.is_(False),
            models.LoginAttempt.attempt_time >= now - timedelta(minutes=BLOCK_MINUTES),
        ).count() + 1
        if recent >= MAX_ATTEMPTS:
            user.blocked_until = now + timedelta(minutes=BLOCK_MINUTES)
        write_audit(
            db, action_type="login", description="Login failed", module="authentication",
            status="failed", user=user, request=request, failure_reason="Invalid credentials",
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db.add(models.LoginAttempt(user_id=user.id, email=user.email, ip_address=ip, success=True))
    user.blocked_until = None
    profile = None
    if user.role == "doctor":
        row = crud.get_doctor_by_user_id(db, user.id)
        if row:
            profile = {"id": row.id, "name": row.name, "specialization": row.specialization}
    elif user.role == "patient":
        row = crud.get_patient_by_user_id(db, user.id)
        if row:
            profile = {"id": row.id, "name": row.name, "contact_number": row.contact_number}
    else:
        profile = {"id": user.id, "name": user.username or "Administrator"}
    write_audit(
        db, action_type="login", description="Login successful", module="authentication",
        status="success", user=user, request=request,
    )
    db.commit()
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "profile": profile,
    }


@router.get("/me")
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = None
    if user.role == "doctor":
        row = crud.get_doctor_by_user_id(db, user.id)
        profile = {"id": row.id, "name": row.name, "specialization": row.specialization} if row else None
    elif user.role == "patient":
        row = crud.get_patient_by_user_id(db, user.id)
        profile = {"id": row.id, "name": row.name, "contact_number": row.contact_number} if row else None
    else:
        profile = {"id": user.id, "name": user.username or "Administrator"}
    return {"user_id": user.id, "email": user.email, "role": user.role, "profile": profile}


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    request: Request,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    validate_password(payload.new_password)
    user.password = hash_password(payload.new_password)
    write_audit(
        db, action_type="password_change", description="Password changed",
        module="authentication", status="success", user=user, request=request,
    )
    db.commit()
    return {"message": "Password updated"}


@router.get("/specializations")
def specializations(db: Session = Depends(get_db)):
    return [
        {"id": row.id, "name": row.name}
        for row in db.query(models.Specialization).filter(
            models.Specialization.status == "active"
        ).order_by(models.Specialization.name).all()
    ]


@router.get("/security-questions")
def security_questions(db: Session = Depends(get_db)):
    return [
        {"id": row.id, "question_text": row.question_text}
        for row in db.query(models.SecurityQuestion).filter(
            models.SecurityQuestion.status == "active"
        ).order_by(models.SecurityQuestion.id).all()
    ]


@router.get("/security-question")
def get_security_questions(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email.lower())
    if not user:
        return {"questions": []}
    rows = db.query(models.SecurityQuestion).join(
        models.UserSecurityAnswer,
        models.UserSecurityAnswer.question_id == models.SecurityQuestion.id,
    ).filter(models.UserSecurityAnswer.user_id == user.id).all()
    return {"questions": [{"id": row.id, "question_text": row.question_text} for row in rows]}


@router.get("/reset-method")
def get_reset_method(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"reset_method": user.reset_method}


@router.get("/email-availability")
def email_availability(email: str, db: Session = Depends(get_db)):
    return {"available": crud.get_user_by_email(db, email.strip().lower()) is None}
