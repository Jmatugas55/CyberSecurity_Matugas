from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..models import LoginAttempt
from .. import schemas, crud
from ..security import verify_password
from ..utils import get_db, validate_password


router = APIRouter()

MAX_ATTEMPTS = 5
BLOCK_MINUTES = 15


@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if not user.password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    pwd = user.password
    if len(pwd.encode('utf-8')) > 72:
        pwd = pwd.encode('utf-8')[:72].decode('utf-8', errors='ignore')

    validate_password(pwd)

    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        created = crud.create_user(
            db,
            user.email,
            pwd,
            role=user.role,
            reset_method=user.reset_method,
            reset_key=user.reset_key,
            security_question=user.security_question,
            security_answer=user.security_answer,
        )

        if user.role == "doctor":
            crud.create_doctor_profile(db, created.id, user.name.strip(), (user.specialization or "").strip())
        else:
            crud.create_patient_profile(db, created.id, user.name.strip(), (user.contact_number or "").strip())

        return created

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as ex:
        print(f"register unexpected: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login")
def login(user: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if db_user.blocked_until and db_user.blocked_until <= datetime.utcnow():
        db_user.blocked_until = None
        db.commit()

    if db_user.blocked_until and db_user.blocked_until > datetime.utcnow():
        raise HTTPException(
            status_code=403,
            detail="Account locked due to multiple failed attempts. Try again later."
        )

    ip = request.client.host

    if not verify_password(user.password, db_user.password):
        attempt = LoginAttempt(
            user_id=db_user.id,
            email=db_user.email,
            ip_address=ip,
            success=False,
        )
        db.add(attempt)
        db.commit()

        attempts = db.query(LoginAttempt.id).filter(
            LoginAttempt.email == user.email,
            LoginAttempt.success == False
        ).count()

        remaining = MAX_ATTEMPTS - attempts

        if attempts >= MAX_ATTEMPTS:
            db_user.blocked_until = datetime.utcnow() + timedelta(minutes=BLOCK_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=403,
                detail=f"Too many failed attempts. Account locked for {BLOCK_MINUTES} minutes."
            )

        plural = "s" if remaining != 1 else ""
        raise HTTPException(
            status_code=401,
            detail=f"Invalid credentials. {remaining} attempt{plural} remaining."
        )

    db.query(LoginAttempt).filter(
        LoginAttempt.email == db_user.email,
        LoginAttempt.success == False
    ).delete()

    success_attempt = LoginAttempt(
        user_id=db_user.id,
        email=db_user.email,
        ip_address=ip,
        success=True
    )
    db.add(success_attempt)

    db_user.blocked_until = None
    db.commit()

    profile = None
    if db_user.role == "doctor":
        d = crud.get_doctor_by_user_id(db, db_user.id)
        if d:
            profile = {"id": d.id, "name": d.name, "specialization": d.specialization}
    else:
        p = crud.get_patient_by_user_id(db, db_user.id)
        if p:
            profile = {"id": p.id, "name": p.name, "contact_number": p.contact_number}

    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
        "profile": profile,
    }


@router.get("/security-question")
def get_security_question(email: EmailStr, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.reset_method != "question" or not user.security_question:
        raise HTTPException(status_code=400, detail="Security question is not available for this account")
    return {"security_question": user.security_question}


@router.get("/reset-method")
def get_reset_method(email: EmailStr, db: Session = Depends(get_db)):
    """Used by the forgot-password page to know which verification UI to show."""
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"reset_method": user.reset_method}
