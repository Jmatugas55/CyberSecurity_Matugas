from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from .. import models, schemas
from ..audit import write_audit
from ..security import get_current_user
from ..utils import get_db

router = APIRouter()


def _notify(db: Session, user_id: int, title: str, message: str):
    db.add(models.Notification(user_id=user_id, title=title, message=message))


@router.post("/appointments", status_code=201)
def create_appointment(
    body: schemas.AppointmentCreate, request: Request,
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
    patient = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
    doctor = db.query(models.Doctor).filter(models.Doctor.id == body.doctor_id).first()
    if not patient or not doctor:
        raise HTTPException(status_code=404, detail="Patient or doctor not found")
    appointment = models.Appointment(
        doctor_id=doctor.id, patient_id=patient.id,
        appointment_date=body.appointment_date, appointment_time=body.appointment_time,
        diagnosis=body.diagnosis, status="pending",
    )
    db.add(appointment)
    db.flush()
    _notify(db, doctor.user_id, "New appointment request", f"{patient.name} requested an appointment.")
    write_audit(
        db, action_type="create_appointment", description="Appointment requested",
        module="appointments", status="success", user=user, request=request, record_id=appointment.id,
    )
    db.commit()
    return {"id": appointment.id, "status": appointment.status}


@router.get("/appointments")
def list_appointments(
    status: str | None = Query(None),
    doctor_id: int | None = Query(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Appointment, models.Doctor, models.Patient).join(
        models.Doctor, models.Doctor.id == models.Appointment.doctor_id
    ).join(models.Patient, models.Patient.id == models.Appointment.patient_id)
    if user.role == "doctor":
        doctor = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
        query = query.filter(models.Appointment.doctor_id == doctor.id) if doctor else query.filter(False)
    elif user.role == "patient":
        patient = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
        query = query.filter(models.Appointment.patient_id == patient.id) if patient else query.filter(False)
    elif user.role == "admin":
        if doctor_id:
            query = query.filter(models.Appointment.doctor_id == doctor_id)
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if status and status != "all":
        query = query.filter(models.Appointment.status == status)
    return [
        {
            "id": appt.id, "doctor_id": doctor.id, "doctor_name": doctor.name,
            "specialization": doctor.specialization, "patient_id": patient.id,
            "patient_name": patient.name, "patient_contact": patient.contact_number,
            "appointment_date": str(appt.appointment_date),
            "appointment_time": str(appt.appointment_time),
            "diagnosis": appt.diagnosis, "status": appt.status,
            "created_at": appt.created_at.isoformat() if appt.created_at else None,
        }
        for appt, doctor, patient in query.order_by(
            models.Appointment.appointment_date.desc(), models.Appointment.appointment_time.desc()
        ).all()
    ]


@router.patch("/appointments/{appointment_id}")
def update_appointment(
    appointment_id: int, body: schemas.AppointmentUpdate, request: Request,
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db),
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if user.role == "doctor":
        doctor = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="This appointment is not assigned to you")
    elif user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the assigned doctor or admin can update appointments")
    if body.status:
        if body.status not in ("pending", "accepted", "rejected", "completed", "cancelled"):
            raise HTTPException(status_code=422, detail="Invalid status")
        appointment.status = body.status
        care_request = db.query(models.CareRequest).filter(
            models.CareRequest.appointment_id == appointment.id
        ).first()
        if care_request:
            if body.status in ("rejected", "cancelled"):
                care_request.status = body.status
                care_request.reviewed_at = None
                for admin in db.query(models.User).filter(
                    models.User.role == "admin",
                    models.User.status == "active",
                    models.User.deleted_at.is_(None),
                ).all():
                    db.add(models.Notification(
                        user_id=admin.id,
                        title="Assigned care request needs review",
                        message=f"Dr. assignment for care request #{care_request.id} was {body.status}. Please review or reassign.",
                    ))
            elif body.status == "completed":
                care_request.status = "completed"
            elif body.status in ("pending", "accepted"):
                care_request.status = "assigned"
    if body.diagnosis is not None:
        appointment.diagnosis = body.diagnosis
    patient = db.query(models.Patient).filter(models.Patient.id == appointment.patient_id).first()
    if patient:
        _notify(db, patient.user_id, "Appointment updated", f"Your appointment is now {appointment.status}.")
    write_audit(
        db, action_type="update_appointment", description="Appointment updated",
        module="appointments", status="success", user=user, request=request, record_id=appointment.id,
    )
    db.commit()
    return {"id": appointment.id, "status": appointment.status, "diagnosis": appointment.diagnosis}


@router.get("/notifications")
def list_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Notification).filter(models.Notification.user_id == user.id).order_by(
        models.Notification.created_at.desc()
    ).all()
    return [
        {
            "id": item.id, "title": item.title, "message": item.message,
            "is_read": bool(item.is_read),
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in rows
    ]


@router.post("/notifications/{notification_id}/read")
def mark_read(
    notification_id: int, user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(models.Notification).filter(
        models.Notification.id == notification_id, models.Notification.user_id == user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    db.commit()
    return {"message": "read"}


@router.post("/notifications/read-all")
def mark_read_all(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"message": "all read"}
