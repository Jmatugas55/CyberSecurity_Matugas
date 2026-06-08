from fastapi import Request
from sqlalchemy.orm import Session

from . import models


def write_audit(
    db: Session,
    *,
    action_type: str,
    description: str,
    module: str,
    status: str,
    user: models.User | None = None,
    request: Request | None = None,
    record_id: int | None = None,
    failure_reason: str | None = None,
) -> None:
    db.add(models.AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else None,
        email=user.email if user else None,
        role=user.role if user else None,
        action_type=action_type,
        action_description=description,
        module_name=module,
        record_id=record_id,
        status=status,
        failure_reason=failure_reason,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500] if request else None,
    ))
