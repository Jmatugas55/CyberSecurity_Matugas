from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..audit import write_audit
from ..face_utils import verify_face
from ..security import verify_password
from ..utils import get_db, validate_password

router = APIRouter()
MAX_RESET_ATTEMPTS = 5


@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email.lower())
    generic = "Verification failed or the account is unavailable"
    if not user or user.role == "admin":
        raise HTTPException(status_code=400, detail=generic)
    if user.reset_method != payload.reset_method:
        raise HTTPException(status_code=400, detail=generic)
    cutoff = datetime.utcnow() - timedelta(minutes=15)
    recent_failures = db.query(models.AuditLog).filter(
        models.AuditLog.user_id == user.id,
        models.AuditLog.action_type == "password_reset_verification",
        models.AuditLog.status == "failed",
        models.AuditLog.created_at >= cutoff,
    ).count()
    if recent_failures >= MAX_RESET_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    verified = False
    if user.reset_method == "key" and payload.reset_key and user.reset_key:
        if user.reset_key.startswith(("$2a$", "$2b$", "$2y$")):
            verified = verify_password(payload.reset_key, user.reset_key)
        else:
            # Preserve existing reset-key accounts, then upgrade the key hash after a successful check.
            verified = secrets.compare_digest(payload.reset_key, user.reset_key)
            if verified:
                from ..security import hash_password
                user.reset_key = hash_password(payload.reset_key)
    elif user.reset_method == "question":
        stored = db.query(models.UserSecurityAnswer).filter(
            models.UserSecurityAnswer.user_id == user.id
        ).all()
        submitted = {item.question_id: item.answer for item in payload.security_answers}
        verified = len(stored) == 3 and all(
            item.question_id in submitted and verify_password(
                submitted[item.question_id].strip().casefold(), item.answer_hash
            )
            for item in stored
        )
    elif user.reset_method == "face" and payload.face_image:
        enrollment = db.query(models.FaceEnrollment).filter(models.FaceEnrollment.user_id == user.id).first()
        if enrollment:
            try:
                verified, _ = verify_face(enrollment.face_image, payload.face_image)
            except ValueError:
                verified = False

    if not verified:
        write_audit(
            db, action_type="password_reset_verification", description="Password reset verification failed",
            module="authentication", status="failed", user=user, request=request,
            failure_reason="Recovery verification failed",
        )
        db.commit()
        raise HTTPException(status_code=400, detail=generic)

    db.query(models.PasswordReset).filter(
        models.PasswordReset.user_id == user.id, models.PasswordReset.used_at.is_(None)
    ).delete()
    token = secrets.token_urlsafe(32)
    db.add(models.PasswordReset(user_id=user.id, token=token, expires_at=datetime.utcnow() + timedelta(minutes=15)))
    write_audit(
        db, action_type="password_reset_request", description="Password reset verified",
        module="authentication", status="success", user=user, request=request,
    )
    db.commit()
    return {"message": "Verification successful", "token": token}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email.lower())
    reset = db.query(models.PasswordReset).filter(
        models.PasswordReset.token == payload.token, models.PasswordReset.used_at.is_(None)
    ).first()
    if not user or not reset or reset.user_id != user.id or reset.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset session")
    validate_password(payload.new_password)
    crud.update_user_password(db, user, payload.new_password)
    reset.used_at = datetime.utcnow()
    user.blocked_until = None
    write_audit(
        db, action_type="password_reset_success", description="Password reset completed",
        module="authentication", status="success", user=user, request=request,
    )
    db.commit()
    return {"message": "Password has been reset"}
