from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))
    reset_method = Column(String(20), nullable=False, default="key")
    reset_key = Column(String(255), nullable=True)
    security_question = Column(String(255), nullable=True)
    security_answer = Column(String(255), nullable=True)

    blocked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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
 