from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime

from .. import database
from .. import models
from ..models import LoginAttempt, User
from ..security import require_roles

router = APIRouter()


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/login-attempts")
def get_login_attempts(filter: str | None = Query(None, description="all|failed|success"),
                       _: models.User = Depends(require_roles("admin")),
                       db: Session = Depends(get_db)):
    """Returns aggregated success/failed counts per email.

    Filtering rules:
      - "all" or no filter: every email that has any attempts
      - "success": only emails with success_count > 0  (and failed/blocked rows are hidden)
      - "failed":  only emails with failed_count > 0   (and success/blocked rows are hidden)
    The frontend uses success_count/failed_count to drive its UI; emails whose
    counts don't match the filter are dropped on this server side.
    """
    success_sum = func.sum(case((LoginAttempt.success == True, 1), else_=0)).label("success_count")
    failed_sum = func.sum(case((LoginAttempt.success == False, 1), else_=0)).label("failed_count")

    agg = db.query(
        LoginAttempt.email,
        success_sum,
        failed_sum,
    ).group_by(LoginAttempt.email)

    if filter == "failed":
        agg = agg.having(func.sum(case((LoginAttempt.success == False, 1), else_=0)) > 0)
    elif filter == "success":
        agg = agg.having(func.sum(case((LoginAttempt.success == True, 1), else_=0)) > 0)

    result = []
    for row in agg:
        result.append({
            "email": row.email,
            "success": int(row.success_count or 0),
            "failed": int(row.failed_count or 0),
        })
    return result


@router.get("/blocked-users")
def get_blocked_users(_: models.User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    """Return users whose account is currently locked due to failed logins."""
    now = datetime.utcnow()
    users = db.query(User).filter(User.blocked_until != None, User.blocked_until > now).all()
    return [
        {"id": u.id, "email": u.email, "blocked_until": u.blocked_until.isoformat()}
        for u in users
    ]


@router.post("/unblock-user/{user_id}")
def unblock_user(user_id: int, _: models.User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.blocked_until = None
    db.query(LoginAttempt).filter(LoginAttempt.email == user.email, LoginAttempt.success == False).delete()
    db.commit()
    return {"message": "User unblocked"}


@router.delete("/login-attempts/{attempt_id}")
def delete_login_attempt(attempt_id: int, _: models.User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    attempt = db.query(LoginAttempt).filter(LoginAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    db.delete(attempt)
    db.commit()
    return {"message": "Login attempt deleted"}


@router.post("/login-attempts/reset-failed/{email}")
def reset_failed_attempts(email: str, _: models.User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False,
    ).delete()
    db.query(User).filter(User.email == email).update({"blocked_until": None})
    db.commit()
    return {"message": "Failed attempts reset and user unlocked"}


@router.post("/login-attempts/reset-success/{email}")
def reset_success_attempts(email: str, _: models.User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == True,
    ).delete()
    db.commit()
    return {"message": "Success attempts cleared"}


@router.post("/login-attempts/reset-all/{email}")
def reset_all_attempts(email: str, _: models.User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db.query(LoginAttempt).filter(LoginAttempt.email == email).delete()
    db.query(User).filter(User.email == email).update({"blocked_until": None})
    db.commit()
    return {"message": "All login attempts cleared and user unlocked"}
