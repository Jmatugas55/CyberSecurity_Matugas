from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, crud
from ..security import verify_password

from ..utils import get_db

router = APIRouter()

@router.post("/change-email/verify")
def verify_change_email(data: schemas.ChangeEmailVerify, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"verified": True}


@router.post("/change-email")
def change_email(request: schemas.ChangeEmailRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, request.current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    try:
        updated = crud.update_user_email(db, user, request.new_email)
        return {"message": "Email updated", "email": updated.email}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


