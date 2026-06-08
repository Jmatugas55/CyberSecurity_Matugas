from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import models, schemas
from ..audit import write_audit
from ..security import get_current_user
from ..triage import suggest_specialization
from ..utils import get_db

router = APIRouter(prefix="/care-requests", tags=["care requests"])


def serialize_request(item: models.CareRequest, patient: models.Patient, doctor: models.Doctor | None = None):
    return {
        "id": item.id,
        "patient_id": patient.id,
        "patient_name": patient.name,
        "patient_contact": patient.contact_number,
        "doctor_id": doctor.id if doctor else None,
        "doctor_name": doctor.name if doctor else None,
        "appointment_id": item.appointment_id,
        "chief_complaint": item.chief_complaint,
        "symptoms": item.symptoms,
        "symptom_duration": item.symptom_duration,
        "severity": item.severity,
        "urgency": item.urgency,
        "preferred_date": str(item.preferred_date) if item.preferred_date else None,
        "preferred_time": str(item.preferred_time) if item.preferred_time else None,
        "visit_type": item.visit_type,
        "known_conditions": item.known_conditions,
        "current_medications": item.current_medications,
        "allergies": item.allergies,
        "additional_notes": item.additional_notes,
        "suggested_specialization": item.suggested_specialization,
        "admin_notes": item.admin_notes,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


@router.post("", status_code=201)
def create_care_request(
    payload: schemas.CareRequestCreate,
    request: Request,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can submit care requests")
    patient = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    item = models.CareRequest(
        patient_id=patient.id,
        suggested_specialization=suggest_specialization(payload.chief_complaint, payload.symptoms),
        **payload.model_dump(),
    )
    db.add(item)
    db.flush()
    for admin in db.query(models.User).filter(
        models.User.role == "admin", models.User.status == "active", models.User.deleted_at.is_(None)
    ).all():
        db.add(models.Notification(
            user_id=admin.id,
            title="New patient care request",
            message=f"{patient.name} submitted: {item.chief_complaint}",
        ))
    write_audit(
        db, action_type="submit_care_request", description="Patient submitted a care request",
        module="care_requests", status="success", user=user, request=request, record_id=item.id,
    )
    db.commit()
    db.refresh(item)
    return serialize_request(item, patient)


@router.get("")
def list_care_requests(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.CareRequest, models.Patient, models.Doctor).join(
        models.Patient, models.Patient.id == models.CareRequest.patient_id
    ).outerjoin(models.Doctor, models.Doctor.id == models.CareRequest.doctor_id)
    if user.role == "patient":
        patient = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
        query = query.filter(models.CareRequest.patient_id == patient.id) if patient else query.filter(False)
    elif user.role == "doctor":
        doctor = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
        query = query.filter(models.CareRequest.doctor_id == doctor.id) if doctor else query.filter(False)
    elif user.role != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return [
        serialize_request(item, patient, doctor)
        for item, patient, doctor in query.order_by(models.CareRequest.created_at.desc()).all()
    ]
