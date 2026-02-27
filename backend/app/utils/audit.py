"""Audit logging for admin actions."""
import logging
from datetime import datetime
from typing import Any

from app.db.mongodb import audit_log_collection

logger = logging.getLogger(__name__)


def log_admin_action(
    admin_id: str,
    action: str,
    resource: str,
    resource_id: str | None = None,
    details: dict | None = None,
    ip: str | None = None,
):
    """Log admin action for audit trail."""
    doc = {
        "admin_id": admin_id,
        "action": action,
        "resource": resource,
        "resource_id": resource_id,
        "details": details or {},
        "ip": ip,
        "created_at": datetime.utcnow(),
    }
    try:
        audit_log_collection.insert_one(doc)
    except Exception as e:
        logger.warning("Audit log failed: %s", e)
