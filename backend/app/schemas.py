from datetime import date, time, datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, root_validator


class EmailPayload(BaseModel):
    @field_validator("email", mode="before", check_fields=False)
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value


class SecurityAnswerInput(BaseModel):
    question_id: int
    answer: str = Field(min_length=3, max_length=200)


class UserCreate(EmailPayload):
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
    security_answers: list[SecurityAnswerInput] = Field(default_factory=list)
    face_image: str | None = None

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
        face = values.get("face_image")

        if role not in ("doctor", "patient"):
            raise ValueError("role must be 'doctor' or 'patient'")
        if not name or not name.strip():
            raise ValueError("name is required")
        if role == "doctor" and (not spec or not spec.strip()):
            raise ValueError("specialization is required for doctors")
        if role == "patient" and (not contact or not contact.strip()):
            raise ValueError("contact number is required for patients")

        answers = values.get("security_answers") or []
        if method not in ("key", "question", "face"):
            raise ValueError("reset_method must be 'key', 'question' or 'face'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if len(answers) != 3 or len({item.question_id for item in answers}) != 3:
                raise ValueError("exactly three different security questions are required")
        elif method == "face" and not face:
            raise ValueError("a captured face image is required")

        return values

    model_config = {"validate_assignment": True}


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class UserLogin(EmailPayload):
    # The seeded development admin uses admin@cyberhealth.local. EmailStr
    # intentionally rejects reserved domains such as .local.
    email: str = Field(min_length=3, max_length=255)
    password: str

    @field_validator("email")
    @classmethod
    def validate_login_email(cls, value: str):
        local, separator, domain = value.partition("@")
        if not separator or not local or "." not in domain or domain.startswith(".") or domain.endswith("."):
            raise ValueError("enter a valid email address")
        return value


class ForgotPasswordRequest(EmailPayload):
    email: EmailStr
    reset_method: str
    reset_key: str | None = None
    security_question: str | None = None
    security_answer: str | None = None
    face_image: str | None = None  # base64 data URL
    security_answers: list[SecurityAnswerInput] = Field(default_factory=list)

    @root_validator(skip_on_failure=True)
    def validate_recovery_method(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")
        answers = values.get("security_answers") or []
        face = values.get("face_image")

        if method not in ("key", "question", "face"):
            raise ValueError("reset_method must be 'key', 'question' or 'face'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if len(answers) != 3 or len({item.question_id for item in answers}) != 3:
                raise ValueError("answers to all three security questions are required")
        elif method == "face":
            if not face:
                raise ValueError("face image is required for face method")

        return values


class ResetPasswordRequest(EmailPayload):
    email: EmailStr
    token: str
    new_password: str


class ChangeEmailVerify(EmailPayload):
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


class CareRequestCreate(BaseModel):
    chief_complaint: str = Field(min_length=3, max_length=255)
    symptoms: str = Field(min_length=3, max_length=2000)
    symptom_duration: str | None = Field(default=None, max_length=100)
    severity: str = "moderate"
    urgency: str = "routine"
    preferred_date: date | None = None
    preferred_time: time | None = None
    visit_type: str = "in_person"
    known_conditions: str | None = Field(default=None, max_length=1000)
    current_medications: str | None = Field(default=None, max_length=1000)
    allergies: str | None = Field(default=None, max_length=1000)
    additional_notes: str | None = Field(default=None, max_length=2000)

    @root_validator(skip_on_failure=True)
    def validate_request(cls, values):
        if values.get("severity") not in ("mild", "moderate", "severe"):
            raise ValueError("severity must be mild, moderate, or severe")
        if values.get("urgency") not in ("routine", "soon", "urgent"):
            raise ValueError("urgency must be routine, soon, or urgent")
        if values.get("visit_type") not in ("in_person", "teleconsultation"):
            raise ValueError("visit type must be in_person or teleconsultation")
        return values


class CareRequestAssignment(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: time
    specialization: str | None = None
    admin_notes: str | None = Field(default=None, max_length=2000)


class CareRequestDecision(BaseModel):
    status: str
    admin_notes: str | None = Field(default=None, max_length=2000)


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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AssignmentCreate(BaseModel):
    doctor_email: EmailStr
    patient_email: EmailStr
    notes: str | None = None

    @field_validator("doctor_email", "patient_email", mode="before")
    @classmethod
    def normalize_assignment_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    specialization: str | None = None
    contact_number: str | None = None
    status: str | None = None
