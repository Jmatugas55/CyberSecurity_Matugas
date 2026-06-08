import os

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from . import models
from .database import Base, engine
from .security import hash_password

SPECIALIZATIONS = [
    "Allergy and Immunology", "Anesthesiology", "Cardiology", "Cardiothoracic Surgery",
    "Colon and Rectal Surgery", "Dermatology", "Emergency Medicine", "Endocrinology",
    "Family Medicine", "Gastroenterology", "General Medicine", "General Surgery",
    "Geriatric Medicine", "Hematology", "Infectious Disease", "Internal Medicine",
    "Medical Genetics and Genomics", "Nephrology", "Neurology", "Neurological Surgery",
    "Nuclear Medicine", "Obstetrics and Gynecology", "Oncology", "Ophthalmology",
    "Orthopedic Surgery", "Otolaryngology / ENT", "Pathology", "Pediatrics",
    "Physical Medicine and Rehabilitation", "Plastic Surgery", "Preventive Medicine",
    "Psychiatry", "Pulmonology", "Radiology", "Rheumatology", "Thoracic Surgery", "Urology",
]

SECURITY_QUESTIONS = [
    "What was the name of your first school?",
    "What city were you born in?",
    "What was your first pet's name?",
    "What is your mother's maiden name?",
    "What was the name of your childhood best friend?",
    "What is the middle name of your oldest sibling?",
]


def _add_missing_columns() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    additions = {
        "users": {
            "username": "VARCHAR(100) NULL",
            "status": "VARCHAR(20) NOT NULL DEFAULT 'active'",
            "updated_at": "DATETIME NULL",
            "deleted_at": "DATETIME NULL",
            "role": "VARCHAR(20) NOT NULL DEFAULT 'patient'",
        },
        "doctors": {
            "specialization_id": "INTEGER NULL",
            "license_number": "VARCHAR(100) NULL",
            "contact_number": "VARCHAR(50) NULL",
            "address": "TEXT NULL",
            "updated_at": "DATETIME NULL",
        },
        "patients": {
            "address": "TEXT NULL",
            "birthdate": "DATE NULL",
            "gender": "VARCHAR(30) NULL",
            "updated_at": "DATETIME NULL",
        },
        "password_resets": {
            "used_at": "DATETIME NULL",
            "failed_attempts": "INTEGER NOT NULL DEFAULT 0",
        },
    }
    with engine.begin() as connection:
        for table, columns in additions.items():
            if table not in tables:
                continue
            existing = {column["name"] for column in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in existing:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def initialize_database() -> None:
    # create_all adds missing tables; the guarded ALTER statements add columns without deleting data.
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        for name in SPECIALIZATIONS:
            if not db.query(models.Specialization).filter(models.Specialization.name == name).first():
                db.add(models.Specialization(name=name))
        for question in SECURITY_QUESTIONS:
            if not db.query(models.SecurityQuestion).filter(
                models.SecurityQuestion.question_text == question
            ).first():
                db.add(models.SecurityQuestion(question_text=question))
        if not db.query(models.User).filter(
            models.User.role == "admin", models.User.deleted_at.is_(None)
        ).first():
            db.add(models.User(
                username="Cyberhealth Admin",
                email=os.getenv("ADMIN_EMAIL", "admin@cyberhealth.local").lower(),
                password=hash_password(os.getenv("ADMIN_PASSWORD", "ChangeMe!123")),
                role="admin",
                status="active",
                reset_method="key",
            ))
        db.commit()
