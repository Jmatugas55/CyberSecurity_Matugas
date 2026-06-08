from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..audit import write_audit
from ..security import get_current_user, verify_password
from ..utils import get_db

router = APIRouter()


@router.post("/change-email/verify")
def verify_change_email(
    data: schemas.ChangeEmailVerify,
    user: models.User = Depends(get_current_user),
):
    if data.email.lower() != user.email.lower() or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"verified": True}


@router.post("/change-email")
def change_email(
    payload: schemas.ChangeEmailRequest, request: Request,
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if payload.current_email.lower() != user.email.lower() or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    try:
        crud.update_user_email(db, user, payload.new_email.lower())
        write_audit(
            db, action_type="change_email", description="Account email changed",
            module="users", status="success", user=user, request=request, record_id=user.id,
        )
        db.commit()
        return {"message": "Email updated", "email": user.email}
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
