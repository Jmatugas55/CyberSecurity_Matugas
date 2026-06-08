from sqlalchemy import (
    TIMESTAMP, Column, ForeignKey, Integer, String, Boolean, DateTime, Text, Date, Time, LargeBinary
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))
    role = Column(String(20), nullable=False, default="patient")
    status = Column(String(20), nullable=False, default="active")
    reset_method = Column(String(20), nullable=False, default="key")
    reset_key = Column(String(255), nullable=True)
    security_question = Column(String(255), nullable=True)
    security_answer = Column(String(255), nullable=True)

    blocked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String(255))
    ip_address = Column(String(45))
    success = Column(Boolean)
    attempt_time = Column('timestamp', TIMESTAMP, server_default=func.now())


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String(255), unique=True, index=True)
    expires_at = Column(DateTime)
    used_at = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, nullable=False, default=0)


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)  # doctor ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    specialization = Column(String(150), nullable=False)
    specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=True)
    license_number = Column(String(100), nullable=True)
    contact_number = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="doctor_profile", uselist=False)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)  # patient ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    contact_number = Column(String(50), nullable=False)
    address = Column(Text, nullable=True)
    birthdate = Column(Date, nullable=True)
    gender = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="patient_profile", uselist=False)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    diagnosis = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending|accepted|rejected|completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CareRequest(Base):
    __tablename__ = "care_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    chief_complaint = Column(String(255), nullable=False)
    symptoms = Column(Text, nullable=False)
    symptom_duration = Column(String(100), nullable=True)
    severity = Column(String(20), nullable=False, default="moderate")
    urgency = Column(String(20), nullable=False, default="routine")
    preferred_date = Column(Date, nullable=True)
    preferred_time = Column(Time, nullable=True)
    visit_type = Column(String(30), nullable=False, default="in_person")
    known_conditions = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    suggested_specialization = Column(String(150), nullable=True)
    admin_notes = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="submitted")
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FaceEnrollment(Base):
    __tablename__ = "face_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    face_image = Column(LargeBinary, nullable=False)  # cropped grayscale 200x200 face
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Specialization(Base):
    __tablename__ = "specializations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SecurityQuestion(Base):
    __tablename__ = "security_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String(255), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserSecurityAnswer(Base):
    __tablename__ = "user_security_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("security_questions.id"), nullable=False)
    answer_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DoctorPatientAssignment(Base):
    __tablename__ = "doctor_patient_assignments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    assigned_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="active")
    notes = Column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    username = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    role = Column(String(20), nullable=True, index=True)
    action_type = Column(String(80), nullable=False, index=True)
    action_description = Column(String(500), nullable=False)
    module_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False)
    failure_reason = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
