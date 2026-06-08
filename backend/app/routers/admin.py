from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..audit import write_audit
from ..security import require_roles
from ..utils import get_db
from .care_requests import serialize_request

router = APIRouter(prefix="/admin", tags=["admin"])
admin_only = require_roles("admin")


def _sync_care_request_statuses(db: Session) -> None:
    rows = db.query(models.CareRequest, models.Appointment).join(
        models.Appointment,
        models.Appointment.id == models.CareRequest.appointment_id,
    ).filter(
        models.CareRequest.status == "assigned",
        models.Appointment.status.in_(("rejected", "cancelled", "completed")),
    ).all()
    for item, appointment in rows:
        item.status = appointment.status
    if rows:
        db.commit()


def _apply_audit_date_filter(query, date_start: date | None, date_end: date | None):
    if date_start:
        query = query.filter(models.AuditLog.created_at >= datetime.combine(date_start, time.min))
    if date_end:
        query = query.filter(models.AuditLog.created_at <= datetime.combine(date_end, time.max))
    return query


@router.get("/summary")
def summary(
    date_start: date | None = None,
    date_end: date | None = None,
    _: models.User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    _sync_care_request_statuses(db)
    count = lambda model, *filters: db.query(func.count(model.id)).filter(*filters).scalar() or 0
    activity_query = _apply_audit_date_filter(db.query(models.AuditLog), date_start, date_end)
    return {
        "patients": count(models.Patient),
        "doctors": count(models.Doctor),
        "appointments": count(models.Appointment),
        "pending": count(models.CareRequest, models.CareRequest.status == "submitted"),
        "completed": count(models.Appointment, models.Appointment.status == "completed"),
        "cancelled": count(models.Appointment, models.Appointment.status.in_(("cancelled", "rejected"))),
        "recent_activities": [
            {
                "id": row.id, "action_type": row.action_type,
                "description": row.action_description, "email": row.email,
                "status": row.status, "created_at": row.created_at,
            }
            for row in activity_query.order_by(models.AuditLog.created_at.desc()).limit(10).all()
        ],
    }


@router.get("/care-requests")
def list_care_requests(
    status: str | None = None,
    _: models.User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    _sync_care_request_statuses(db)
    query = db.query(models.CareRequest, models.Patient, models.Doctor).join(
        models.Patient, models.Patient.id == models.CareRequest.patient_id
    ).outerjoin(models.Doctor, models.Doctor.id == models.CareRequest.doctor_id)
    if status and status != "all":
        query = query.filter(models.CareRequest.status == status)
    return [
        serialize_request(item, patient, doctor)
        for item, patient, doctor in query.order_by(models.CareRequest.created_at.desc()).all()
    ]


@router.post("/care-requests/{request_id}/assign")
def assign_care_request(
    request_id: int,
    payload: schemas.CareRequestAssignment,
    request: Request,
    admin: models.User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    item = db.query(models.CareRequest).filter(models.CareRequest.id == request_id).first()
    doctor = db.query(models.Doctor).join(
        models.User, models.User.id == models.Doctor.user_id
    ).filter(
        models.Doctor.id == payload.doctor_id,
        models.User.status == "active",
        models.User.deleted_at.is_(None),
    ).first()
    patient = db.query(models.Patient).filter(models.Patient.id == item.patient_id).first() if item else None
    if not item or not doctor or not patient:
        raise HTTPException(status_code=404, detail="Care request, doctor, or patient not found")
    rejected_assignment = False
    if item and item.appointment_id:
        rejected_assignment = db.query(models.Appointment).filter(
            models.Appointment.id == item.appointment_id,
            models.Appointment.status.in_(("rejected", "cancelled")),
        ).first() is not None
    if item.status in ("completed", "cancelled") or (item.status == "rejected" and not rejected_assignment):
        raise HTTPException(status_code=409, detail="This care request can no longer be assigned")

    db.query(models.DoctorPatientAssignment).filter(
        models.DoctorPatientAssignment.patient_id == patient.id,
        models.DoctorPatientAssignment.status == "active",
    ).update({"status": "reassigned"})
    assignment = models.DoctorPatientAssignment(
        doctor_id=doctor.id,
        patient_id=patient.id,
        assigned_by_admin_id=admin.id,
        notes=payload.admin_notes or f"Assigned from care request #{item.id}",
        status="active",
    )
    appointment = models.Appointment(
        doctor_id=doctor.id,
        patient_id=patient.id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        diagnosis=item.chief_complaint,
        status="pending",
    )
    db.add_all([assignment, appointment])
    db.flush()
    item.doctor_id = doctor.id
    item.appointment_id = appointment.id
    item.admin_notes = payload.admin_notes
    item.status = "assigned"
    item.reviewed_by_admin_id = admin.id
    item.reviewed_at = datetime.utcnow()
    db.add(models.Notification(
        user_id=doctor.user_id,
        title="Patient assigned",
        message=f"{patient.name} was assigned for {item.chief_complaint}.",
    ))
    db.add(models.Notification(
        user_id=patient.user_id,
        title="Care request assigned",
        message=f"Your request was assigned to Dr. {doctor.name} for {payload.appointment_date} at {payload.appointment_time}.",
    ))
    write_audit(
        db, action_type="assign_care_request",
        description=f"Assigned care request to Dr. {doctor.name}",
        module="care_requests", status="success", user=admin, request=request, record_id=item.id,
    )
    db.commit()
    return {
        "message": "Care request assigned and appointment created",
        "appointment_id": appointment.id,
        "specialization_match": doctor.specialization == item.suggested_specialization,
        "doctor_specialization": doctor.specialization,
        "suggested_specialization": item.suggested_specialization,
    }


@router.patch("/care-requests/{request_id}")
def decide_care_request(
    request_id: int,
    payload: schemas.CareRequestDecision,
    request: Request,
    admin: models.User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    if payload.status not in ("under_review", "rejected", "cancelled"):
        raise HTTPException(status_code=422, detail="Invalid care request status")
    item = db.query(models.CareRequest).filter(models.CareRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Care request not found")
    item.status = payload.status
    item.admin_notes = payload.admin_notes
    item.reviewed_by_admin_id = admin.id
    item.reviewed_at = datetime.utcnow()
    patient = db.query(models.Patient).filter(models.Patient.id == item.patient_id).first()
    if patient:
        db.add(models.Notification(
            user_id=patient.user_id,
            title="Care request updated",
            message=f"Your care request is now {payload.status.replace('_', ' ')}.",
        ))
    write_audit(
        db, action_type="review_care_request", description=f"Care request marked {payload.status}",
        module="care_requests", status="success", user=admin, request=request, record_id=item.id,
    )
    db.commit()
    return {"message": "Care request updated"}


def _profile_rows(db: Session, role: str, search: str, page: int, page_size: int):
    profile = models.Doctor if role == "doctor" else models.Patient
    query = db.query(profile, models.User).join(models.User, models.User.id == profile.user_id).filter(
        models.User.deleted_at.is_(None)
    )
    if search:
        query = query.filter(or_(
            profile.name.ilike(f"%{search}%"),
            models.User.email.ilike(f"%{search}%"),
        ))
    total = query.count()
    rows = query.order_by(profile.name).offset((page - 1) * page_size).limit(page_size).all()
    return total, rows


@router.get("/users/{role}")
def list_users(
    role: str, search: str = "", page: int = 1, page_size: int = Query(20, le=100),
    _: models.User = Depends(admin_only), db: Session = Depends(get_db),
):
    if role not in ("doctor", "patient"):
        raise HTTPException(status_code=422, detail="Role must be doctor or patient")
    total, rows = _profile_rows(db, role, search, max(page, 1), page_size)
    return {
        "total": total,
        "items": [
            {
                "id": profile.id, "user_id": user.id, "name": profile.name,
                "email": user.email, "status": user.status,
                "specialization": getattr(profile, "specialization", None),
                "contact_number": getattr(profile, "contact_number", None),
            }
            for profile, user in rows
        ],
    }


@router.patch("/users/{user_id}")
def update_user(
    user_id: int, payload: schemas.UserUpdate, request: Request,
    admin: models.User = Depends(admin_only), db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.deleted_at.is_(None)).first()
    if not user or user.role not in ("doctor", "patient"):
        raise HTTPException(status_code=404, detail="User not found")
    if payload.email:
        existing = db.query(models.User).filter(models.User.email == payload.email, models.User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = payload.email.lower()
    if payload.status in ("active", "inactive"):
        user.status = payload.status
    profile = db.query(models.Doctor if user.role == "doctor" else models.Patient).filter_by(user_id=user.id).first()
    if payload.name:
        profile.name = payload.name.strip()
        user.username = payload.name.strip()
    if user.role == "doctor" and payload.specialization:
        spec = db.query(models.Specialization).filter(
            models.Specialization.name == payload.specialization,
            models.Specialization.status == "active",
        ).first()
        if not spec:
            raise HTTPException(status_code=422, detail="Invalid specialization")
        profile.specialization = spec.name
        profile.specialization_id = spec.id
    if user.role == "patient" and payload.contact_number:
        profile.contact_number = payload.contact_number
    write_audit(
        db, action_type="update_user", description=f"Updated {user.role} account",
        module="users", status="success", user=admin, request=request, record_id=user.id,
    )
    db.commit()
    return {"message": "User updated"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, request: Request, admin: models.User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.deleted_at.is_(None)).first()
    if not user or user.role == "admin":
        raise HTTPException(status_code=404, detail="User not found")
    user.deleted_at = datetime.utcnow()
    user.status = "inactive"
    write_audit(
        db, action_type="soft_delete_user", description=f"Soft deleted {user.role} account",
        module="users", status="success", user=admin, request=request, record_id=user.id,
    )
    db.commit()
    return {"message": "User archived"}


@router.post("/assignments")
def assign_patient(
    payload: schemas.AssignmentCreate, request: Request,
    admin: models.User = Depends(admin_only), db: Session = Depends(get_db),
):
    doctor = db.query(models.Doctor).join(
        models.User, models.User.id == models.Doctor.user_id
    ).filter(
        models.User.email == payload.doctor_email,
        models.User.role == "doctor",
        models.User.status == "active",
        models.User.deleted_at.is_(None),
    ).first()
    patient = db.query(models.Patient).join(
        models.User, models.User.id == models.Patient.user_id
    ).filter(
        models.User.email == payload.patient_email,
        models.User.role == "patient",
        models.User.status == "active",
        models.User.deleted_at.is_(None),
    ).first()
    if not doctor or not patient:
        raise HTTPException(status_code=404, detail="Active doctor or patient email not found")
    db.query(models.DoctorPatientAssignment).filter(
        models.DoctorPatientAssignment.patient_id == patient.id,
        models.DoctorPatientAssignment.status == "active",
    ).update({"status": "reassigned"})
    assignment = models.DoctorPatientAssignment(
        doctor_id=doctor.id, patient_id=patient.id, assigned_by_admin_id=admin.id,
        notes=payload.notes, status="active",
    )
    db.add(assignment)
    db.flush()
    write_audit(
        db, action_type="assign_patient", description="Assigned patient to doctor",
        module="assignments", status="success", user=admin, request=request, record_id=assignment.id,
    )
    db.commit()
    return {"id": assignment.id, "message": "Patient assigned"}


@router.get("/assignments")
def assignments(_: models.User = Depends(admin_only), db: Session = Depends(get_db)):
    rows = db.query(
        models.DoctorPatientAssignment, models.Doctor, models.Patient
    ).join(models.Doctor, models.Doctor.id == models.DoctorPatientAssignment.doctor_id).join(
        models.Patient, models.Patient.id == models.DoctorPatientAssignment.patient_id
    ).order_by(models.DoctorPatientAssignment.assigned_at.desc()).all()
    return [
        {
            "id": item.id, "doctor_id": doctor.id, "doctor_name": doctor.name,
            "patient_id": patient.id, "patient_name": patient.name,
            "status": item.status, "notes": item.notes, "assigned_at": item.assigned_at,
        }
        for item, doctor, patient in rows
    ]


@router.get("/audit-logs")
def audit_logs(
    search: str = "", role: str | None = None, action: str | None = None,
    status: str | None = None, date_start: date | None = None,
    date_end: date | None = None, page: int = 1,
    page_size: int = Query(50, le=100),
    _: models.User = Depends(admin_only), db: Session = Depends(get_db),
):
    query = _apply_audit_date_filter(db.query(models.AuditLog), date_start, date_end)
    if search:
        query = query.filter(or_(
            models.AuditLog.email.ilike(f"%{search}%"),
            models.AuditLog.username.ilike(f"%{search}%"),
            models.AuditLog.action_description.ilike(f"%{search}%"),
        ))
    if role:
        query = query.filter(models.AuditLog.role == role)
    if action:
        query = query.filter(models.AuditLog.action_type == action)
    if status:
        query = query.filter(models.AuditLog.status == status)
    total = query.count()
    rows = query.order_by(models.AuditLog.created_at.desc()).offset((max(page, 1) - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": rows}
