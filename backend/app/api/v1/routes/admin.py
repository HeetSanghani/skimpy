"""
Admin router - /api/admin/*
Superadmin-only APIs. Requires JWT with role admin.
Includes audit logging for admin actions.
"""
from fastapi import APIRouter, Depends, Request

from app.security.dependencies import get_current_user
from app.db.mongodb import user_collection, cate_db, audit_log_collection
from app.utils.audit import log_admin_action

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.get("/stats")
def get_admin_stats(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get basic platform statistics. Admin only."""
    log_admin_action(
        admin_id=str(current_user.get("user_id", "admin")),
        action="view_stats",
        resource="stats",
        ip=_get_client_ip(request),
    )
    users_count = user_collection.count_documents({})
    products_count = cate_db.products.count_documents({})
    categories_count = cate_db.categories.count_documents({})
    vendors_count = cate_db.vendors.count_documents({})
    orders_count = cate_db.orders.count_documents({})
    return {
        "users": users_count,
        "products": products_count,
        "categories": categories_count,
        "vendors": vendors_count,
        "orders": orders_count,
    }


@router.get("/users")
def list_users(
    request: Request,
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
):
    """List users. Admin only."""
    log_admin_action(
        admin_id=str(current_user.get("user_id", "admin")),
        action="list_users",
        resource="users",
        details={"skip": skip, "limit": limit},
        ip=_get_client_ip(request),
    )
    users = list(user_collection.find({}).skip(skip).limit(limit))
    for u in users:
        u["_id"] = str(u["_id"])
        if "password" in u:
            u["password"] = "[REDACTED]"
    return users


@router.get("/audit-log")
def get_audit_log(
    request: Request,
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """Get admin audit log. Admin only."""
    log_admin_action(
        admin_id=str(current_user.get("user_id", "admin")),
        action="view_audit_log",
        resource="audit_log",
        ip=_get_client_ip(request),
    )
    logs = list(audit_log_collection.find({}).sort("created_at", -1).skip(skip).limit(limit))
    for log in logs:
        log["_id"] = str(log["_id"])
        if "created_at" in log:
            log["created_at"] = log["created_at"].isoformat()
    return logs
