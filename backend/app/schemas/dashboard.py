# backend/app/schemas/dashboard.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .product import ProductResponse


# ---------------- Dashboard Stats Schema ----------------
class DashboardStats(BaseModel):
    total_products: int = 0
    total_sales: int = 0
    total_revenue: float = 0.0
    pending_orders: int = 0
    completed_orders: int = 0


# ---------------- Dashboard Response Schema ----------------
class SellerDashboardResponse(BaseModel):
    my_listings: List[ProductResponse] = []
    stats: DashboardStats
    orders: List[dict] = []  # Will be properly typed when orders are implemented

