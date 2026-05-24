from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..utils import get_db

router = APIRouter()


def _notify(db: Session, user_id: int, title: str, message: str):
    n = models.Notification(user_id=user_id, title=title, message=message)
    db.add(n)


@router.post("/appointments")
def create_appointment(body: schemas.AppointmentCreate, patient_email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == patient_email).first()
    if not user or user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    patient = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    doctor = db.query(models.Doctor).filter(models.Doctor.id == body.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appt = models.Appointment(
        doctor_id=doctor.id,
        patient_id=patient.id,
        appointment_date=body.appointment_date,
        appointment_time=body.appointment_time,
        diagnosis=body.diagnosis,
        status="pending",
    )
    db.add(appt)

    _notify(
        db,
        doctor.user_id,
        "New appointment request",
        f"{patient.name} requested an appointment on {body.appointment_date} at {body.appointment_time}.",
    )
    db.commit()
    db.refresh(appt)
    return {"id": appt.id, "status": appt.status}


@router.get("/appointments")
def list_appointments(
    role: str = Query(...),
    email: str = Query(...),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    q = db.query(models.Appointment, models.Doctor, models.Patient) \
        .join(models.Doctor, models.Doctor.id == models.Appointment.doctor_id) \
        .join(models.Patient, models.Patient.id == models.Appointment.patient_id)

    if role == "doctor":
        d = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
        if not d:
            return []
        q = q.filter(models.Appointment.doctor_id == d.id)
    else:
        p = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
        if not p:
            return []
        q = q.filter(models.Appointment.patient_id == p.id)

    if status and status != "all":
        q = q.filter(models.Appointment.status == status)

    rows = q.order_by(models.Appointment.appointment_date.desc(), models.Appointment.appointment_time.desc()).all()
    out = []
    for appt, doc, pat in rows:
        out.append({
            "id": appt.id,
            "doctor_id": doc.id,
            "doctor_name": doc.name,
            "specialization": doc.specialization,
            "patient_id": pat.id,
            "patient_name": pat.name,
            "patient_contact": pat.contact_number,
            "appointment_date": str(appt.appointment_date),
            "appointment_time": str(appt.appointment_time),
            "diagnosis": appt.diagnosis,
            "status": appt.status,
            "created_at": appt.created_at.isoformat() if appt.created_at else None,
        })
    return out


@router.patch("/appointments/{appt_id}")
def update_appointment(appt_id: int, body: schemas.AppointmentUpdate, db: Session = Depends(get_db)):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = db.query(models.Patient).filter(models.Patient.id == appt.patient_id).first()
    doctor = db.query(models.Doctor).filter(models.Doctor.id == appt.doctor_id).first()

    if body.status:
        if body.status not in ("pending", "accepted", "rejected", "completed"):
            raise HTTPException(status_code=400, detail="Invalid status")
        appt.status = body.status

        if patient and doctor:
            label = body.status.upper()
            _notify(
                db,
                patient.user_id,
                f"Appointment {label}",
                f"Dr. {doctor.name} {body.status} your appointment on {appt.appointment_date} at {appt.appointment_time}.",
            )

    if body.diagnosis is not None:
        appt.diagnosis = body.diagnosis
        if patient and doctor and body.status is None:
            _notify(
                db,
                patient.user_id,
                "Diagnosis updated",
                f"Dr. {doctor.name} updated your diagnosis for {appt.appointment_date}.",
            )

    db.commit()
    db.refresh(appt)
    return {"id": appt.id, "status": appt.status, "diagnosis": appt.diagnosis}


@router.delete("/appointments/{appt_id}")
def delete_appointment(appt_id: int, db: Session = Depends(get_db)):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()
    return {"message": "deleted"}


@router.get("/notifications")
def list_notifications(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    rows = db.query(models.Notification) \
        .filter(models.Notification.user_id == user.id) \
        .order_by(models.Notification.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": bool(n.is_read),
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in rows
    ]


@router.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "read"}


@router.post("/notifications/read-all")
def mark_read_all(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(models.Notification).filter(models.Notification.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"message": "all read"}
