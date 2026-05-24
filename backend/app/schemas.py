from datetime import date, time, datetime
from pydantic import BaseModel, EmailStr, root_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "patient"  # 'doctor' or 'patient'
    name: str | None = None
    specialization: str | None = None
    contact_number: str | None = None
    reset_method: str
    reset_key: str | None = None
    security_question: str | None = None
    security_answer: str | None = None

    @root_validator(skip_on_failure=True)
    def validate_payload(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")
        role = values.get("role")
        name = values.get("name")
        spec = values.get("specialization")
        contact = values.get("contact_number")

        if role not in ("doctor", "patient"):
            raise ValueError("role must be 'doctor' or 'patient'")
        if not name or not name.strip():
            raise ValueError("name is required")
        if role == "doctor" and (not spec or not spec.strip()):
            raise ValueError("specialization is required for doctors")
        if role == "patient" and (not contact or not contact.strip()):
            raise ValueError("contact number is required for patients")

        if method not in ("key", "question", "face"):
            raise ValueError("reset_method must be 'key', 'question' or 'face'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if not question or not question.strip():
                raise ValueError("security question cannot be empty")
            if not answer or len(answer.strip()) < 3:
                raise ValueError("security answer must be at least 3 characters")

        return values

    model_config = {"validate_assignment": True}


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    reset_method: str
    reset_key: str | None = None
    security_question: str | None = None
    security_answer: str | None = None
    face_image: str | None = None  # base64 data URL

    @root_validator(skip_on_failure=True)
    def validate_recovery_method(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")
        face = values.get("face_image")

        if method not in ("key", "question", "face"):
            raise ValueError("reset_method must be 'key', 'question' or 'face'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if not question or not question.strip():
                raise ValueError("security question is required for security question method")
            if not answer or len(answer.strip()) < 3:
                raise ValueError("security answer must be at least 3 characters")
        elif method == "face":
            if not face:
                raise ValueError("face image is required for face method")

        return values


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str


class ChangeEmailVerify(BaseModel):
    email: EmailStr
    password: str


class ChangeEmailRequest(BaseModel):
    current_email: EmailStr
    password: str
    new_email: EmailStr


class FaceEnrollRequest(BaseModel):
    email: EmailStr
    face_image: str  # base64 data URL


class FaceVerifyRequest(BaseModel):
    email: EmailStr
    face_image: str


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: time
    diagnosis: str | None = None


class AppointmentUpdate(BaseModel):
    status: str | None = None
    diagnosis: str | None = None


class DoctorOut(BaseModel):
    id: int
    name: str
    specialization: str
    email: EmailStr | None = None

    model_config = {"from_attributes": True}


class PatientOut(BaseModel):
    id: int
    name: str
    contact_number: str
    email: EmailStr | None = None

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
