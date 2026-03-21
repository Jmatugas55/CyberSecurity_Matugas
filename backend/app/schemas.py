from pydantic import BaseModel, EmailStr, root_validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    reset_method: str
    reset_key: str | None = None
    security_question: str | None = None
    security_answer: str | None = None

    @root_validator(skip_on_failure=True)
    def validate_reset_method(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")

        if method not in ("key", "question"):
            raise ValueError("reset_method must be 'key' or 'question'")

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

    @root_validator(skip_on_failure=True)
    def validate_recovery_method(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")

        if method not in ("key", "question"):
            raise ValueError("reset_method must be 'key' or 'question'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if not question or not question.strip():
                raise ValueError("security question is required for security question method")
            if not answer or len(answer.strip()) < 3:
                raise ValueError("security answer must be at least 3 characters")

        return values


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str