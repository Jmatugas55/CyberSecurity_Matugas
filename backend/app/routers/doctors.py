from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..utils import get_db

router = APIRouter()


@router.get("/doctors")
def list_doctors(db: Session = Depends(get_db)):
    rows = db.query(models.Doctor, models.User).join(models.User, models.User.id == models.Doctor.user_id).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "specialization": d.specialization,
            "email": u.email,
        }
        for d, u in rows
    ]


@router.get("/patients")
def list_patients(db: Session = Depends(get_db)):
    rows = db.query(models.Patient, models.User).join(models.User, models.User.id == models.Patient.user_id).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "contact_number": p.contact_number,
            "email": u.email,
            "user_id": u.id,
        }
        for p, u in rows
    ]


@router.get("/me")
def get_me(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "doctor":
        d = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
        return {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "profile": {"id": d.id, "name": d.name, "specialization": d.specialization} if d else None,
        }
    p = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "profile": {"id": p.id, "name": p.name, "contact_number": p.contact_number} if p else None,
    }
