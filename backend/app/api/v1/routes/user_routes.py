"""
User router - /api/user/*
Buyer protected APIs. Requires JWT with role user, seller, or admin.
"""
from fastapi import APIRouter, Depends, BackgroundTasks

from app.schemas.auth import ResetPasswordRequest
from app.services.auth import reset_password_logic
from app.security.dependencies import get_current_user

# Import sub-routers
from . import users, cart, wishlist, orders, payments, chat

router = APIRouter(prefix="/api/user", tags=["User"])

# Mount sub-routers
router.include_router(users.router)
router.include_router(cart.router)
router.include_router(wishlist.router)
router.include_router(orders.router)
router.include_router(payments.router)
router.include_router(chat.router)


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change password for authenticated user."""
    return reset_password_logic(request, current_user)
