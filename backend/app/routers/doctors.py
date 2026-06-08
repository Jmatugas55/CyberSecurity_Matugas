from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..security import get_current_user, require_roles
from ..utils import get_db

router = APIRouter()


@router.get("/doctors")
def list_doctors(
    _: models.User = Depends(require_roles("patient", "admin")),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Doctor, models.User).join(
        models.User, models.User.id == models.Doctor.user_id
    ).filter(models.User.status == "active", models.User.deleted_at.is_(None)).all()
    return [
        {"id": doctor.id, "name": doctor.name, "specialization": doctor.specialization, "email": user.email}
        for doctor, user in rows
    ]


@router.get("/patients")
def list_patients(
    user: models.User = Depends(require_roles("doctor", "admin")),
    db: Session = Depends(get_db),
):
    query = db.query(models.Patient, models.User).join(
        models.User, models.User.id == models.Patient.user_id
    ).filter(models.User.status == "active", models.User.deleted_at.is_(None))
    if user.role == "doctor":
        doctor = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
        if not doctor:
            return []
        query = query.join(
            models.DoctorPatientAssignment,
            models.DoctorPatientAssignment.patient_id == models.Patient.id,
        ).filter(
            models.DoctorPatientAssignment.doctor_id == doctor.id,
            models.DoctorPatientAssignment.status == "active",
        )
    return [
        {
            "id": patient.id, "name": patient.name, "contact_number": patient.contact_number,
            "email": account.email, "user_id": account.id,
        }
        for patient, account in query.all()
    ]


@router.get("/assigned-doctor")
def assigned_doctor(
    user: models.User = Depends(require_roles("patient")),
    db: Session = Depends(get_db),
):
    patient = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
    if not patient:
        return None
    row = db.query(models.DoctorPatientAssignment, models.Doctor).join(
        models.Doctor, models.Doctor.id == models.DoctorPatientAssignment.doctor_id
    ).filter(
        models.DoctorPatientAssignment.patient_id == patient.id,
        models.DoctorPatientAssignment.status == "active",
    ).first()
    if not row:
        return None
    assignment, doctor = row
    return {"id": doctor.id, "name": doctor.name, "specialization": doctor.specialization, "assigned_at": assignment.assigned_at}
