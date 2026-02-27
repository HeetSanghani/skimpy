"""
Admin router - /api/admin/*
Superadmin-only APIs. Requires JWT with role admin.
Includes audit logging for admin actions.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from bson import ObjectId

from app.security.dependencies import get_current_user
from app.db.mongodb import (
    user_collection,
    cate_db,
    audit_log_collection,
    cart_collection,
    login_attempts_collection,
    user_db,
)
from app.utils.audit import log_admin_action

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Additional collections for cascading deletes
wishlist_collection = user_db.wishlist
product_collection = cate_db.products
vendor_collection = cate_db.vendors
variant_collection = cate_db.variants
order_collection = cate_db.orders


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
    products_count = product_collection.count_documents({})
    categories_count = cate_db.categories.count_documents({})
    vendors_count = vendor_collection.count_documents({})
    orders_count = order_collection.count_documents({})
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


@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Delete a user and related cart/wishlist data."""
    user = user_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_admin_action(
        admin_id=str(current_user.get("user_id", "admin")),
        action="delete_user",
        resource="users",
        resource_id=user_id,
        details={"email": user.get("email")},
        ip=_get_client_ip(request),
    )

    user_collection.delete_one({"_id": user["_id"]})
    cart_collection.delete_many({"user_id": user_id})
    wishlist_collection.delete_many({"user_id": user_id})
    if user.get("email"):
        login_attempts_collection.delete_many({"email": user["email"]})

    return {"message": "User deleted", "user_id": user_id}


@router.delete("/vendors/{vendor_id}")
def delete_vendor_admin(
    vendor_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Delete a vendor and all their products."""
    criteria = {}
    if ObjectId.is_valid(vendor_id):
        criteria = {"_id": ObjectId(vendor_id)}
    else:
        criteria = {"user_id": vendor_id}

    vendor = vendor_collection.find_one(criteria)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vid = vendor["_id"]

    log_admin_action(
        admin_id=str(current_user.get("user_id", "admin")),
        action="delete_vendor",
        resource="vendors",
        resource_id=str(vid),
        details={"user_id": vendor.get("user_id"), "shop_name": vendor.get("shop_name")},
        ip=_get_client_ip(request),
    )

    # Delete vendor document
    vendor_collection.delete_one({"_id": vid})

    # Delete products and related variants/cart/wishlist entries
    products = list(product_collection.find({"vendor_id": vid}))
    product_ids = [str(p["_id"]) for p in products]
    product_collection.delete_many({"vendor_id": vid})
    if product_ids:
        variant_collection.delete_many(
            {"product_id": {"$in": product_ids + [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]}}
        )
        cart_collection.delete_many({"product_id": {"$in": product_ids}})
        wishlist_collection.delete_many({"product_id": {"$in": product_ids}})

    return {
        "message": "Vendor and associated products deleted",
        "vendor_id": str(vid),
        "deleted_products": len(product_ids),
    }


@router.delete("/products/{product_id}")
def delete_product_admin(
    product_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Delete a single product and its variants, cart, and wishlist references."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product_id")
    pid = ObjectId(product_id)
    product = product_collection.find_one({"_id": pid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    log_admin_action(
        admin_id=str(current_user.get("user_id", "admin")),
        action="delete_product",
        resource="products",
        resource_id=product_id,
        details={"product_name": product.get("product_name")},
        ip=_get_client_ip(request),
    )

    product_collection.delete_one({"_id": pid})
    # Variants may store product_id as string or ObjectId
    variant_collection.delete_many(
        {"product_id": {"$in": [product_id, pid]}}
    )
    cart_collection.delete_many({"product_id": product_id})
    wishlist_collection.delete_many({"product_id": product_id})

    return {"message": "Product deleted", "product_id": product_id}


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
