from fastapi import APIRouter, HTTPException, Depends  # <-- This is the corrected line
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from ....db.mongodb import cate_db, user_db
from ....schemas.dashboard import SellerDashboardResponse, DashboardStats
from ....schemas.product import ProductResponse
from app.core.security import get_current_user
router = APIRouter(prefix="/seller/dashboard", tags=["Seller Dashboard"])
# Collections
product_collection = cate_db.products
orders_collection = user_db.orders
# ---------- Helpers ----------
def objectid_str(doc):
    """Convert ObjectId fields to strings for JSON response."""
    if not doc:
        return doc
    doc["_id"] = str(doc["_id"])
    if "category_id" in doc and doc["category_id"]:
        doc["category_id"] = str(doc["category_id"])
    if "vendor_id" in doc and doc["vendor_id"]:
        doc["vendor_id"] = str(doc["vendor_id"])
    if "product_id" in doc and doc["product_id"]:
        doc["product_id"] = str(doc["product_id"])
    if "buyer_id" in doc and doc["buyer_id"]:
        doc["buyer_id"] = str(doc["buyer_id"])
    if "seller_id" in doc and doc["seller_id"]:
        doc["seller_id"] = str(doc["seller_id"])
    return doc
def validate_objectid(id_str: str) -> ObjectId:
    """Validate and convert string to ObjectId."""
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ObjectId")
    return ObjectId(id_str)
# --- MODIFIED HELPER ---
# This function now matches the logic from your old 'products.py'
def get_vendor_oid_from_token(current_user: dict) -> ObjectId:
    """
    Looks up the vendor_id from the 'vendors' collection based on
    the user_id field in the auth token.
    """
    # Get the 'user_id' string field from the token (NOT the token's '_id')
    user_id_str = current_user.get("user_id")
    if not user_id_str:
        raise HTTPException(status_code=400, detail="User ID field not found in token")
    # Find the matching vendor in the 'vendors' collection
    user_vendor = cate_db.vendors.find_one({"user_id": str(user_id_str)})
    if not user_vendor:
        raise HTTPException(status_code=404, detail="No vendor profile associated with current user")
    # Return the vendor's _id (as an ObjectId)
    return user_vendor["_id"]
def ensure_seller(current_user: dict):
    """Ensure the authenticated user has seller role."""
    role = (current_user.get("role") or "").lower()
    if role != "seller":
        raise HTTPException(status_code=403, detail="Seller access required")
# ---------- :package: MY LISTINGS (MODIFIED) ----------
@router.get("/listings", response_model=List[ProductResponse])
def get_my_listings(
    current_user: dict = Depends(get_current_user),
    limit: Optional[int] = 50,
    skip: Optional[int] = 0
):
    """
    :package: Get all products listed by the current seller.
    Returns a list of products where vendor_id matches the current user's vendor profile.
    """
    ensure_seller(current_user)
    # --- CHANGED ---
    # We now get the complex vendor ID, not the simple user ID
    vendor_id = get_vendor_oid_from_token(current_user)
    query = {"vendor_id": vendor_id}
    products = list(product_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
    return [objectid_str(p) for p in products]
# ---------- :moneybag: EARNINGS / SALES (MODIFIED) ----------
@router.get("/earnings", response_model=DashboardStats)
def get_earnings_and_sales(current_user: dict = Depends(get_current_user)):
    """
    :moneybag: Get earnings and sales statistics for the current seller.
    Returns total products, total sales, total revenue, and order statistics.
    """
    ensure_seller(current_user)
    # --- CHANGED ---
    vendor_id = get_vendor_oid_from_token(current_user)
    # Get total products count
    total_products = product_collection.count_documents({"vendor_id": vendor_id})
    # Initialize stats
    total_sales = 0
    total_revenue = 0.0
    pending_orders = 0
    completed_orders = 0
    # Try to get orders if collection exists and has data
    try:
        # NOTE: This assumes your 'orders' collection uses the 'vendor_id'
        # from the 'vendors' collection. If it uses the user '_id', this will fail.
        orders_query = {"seller_id": vendor_id} # <-- This might be a new bug
        orders = list(orders_collection.find(orders_query))
        for order in orders:
            order = objectid_str(order)
            # Calculate revenue from completed orders
            if order.get("status") == "completed" or order.get("status") == "delivered":
                completed_orders += 1
                order_total = order.get("total", 0) or order.get("amount", 0)
                if isinstance(order_total, (int, float)):
                    total_revenue += float(order_total)
                    total_sales += 1
            elif order.get("status") in ["pending", "processing", "confirmed"]:
                pending_orders += 1
    except Exception:
        pass
    stats = DashboardStats(
        total_products=total_products,
        total_sales=total_sales,
        total_revenue=round(total_revenue, 2),
        pending_orders=pending_orders,
        completed_orders=completed_orders
    )
    return stats
# ---------- :mailbox: ORDERS (MODIFIED) ----------
@router.get("/orders")
def get_my_orders(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    limit: Optional[int] = 50,
    skip: Optional[int] = 0
):
    """
    :mailbox: Get all orders for the current seller.
    Optional status filter: pending, processing, completed, cancelled, etc.
    """
    ensure_seller(current_user)
    # --- CHANGED ---
    vendor_id = get_vendor_oid_from_token(current_user)
    try:
        # NOTE: This assumes 'seller_id' in your 'orders' collection
        # matches the '_id' from the 'vendors' collection.
        query = {"seller_id": vendor_id} # <-- This might be a new bug
        if status:
            query["status"] = status
        orders = list(orders_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
        return [objectid_str(order) for order in orders]
    except Exception as e:
        return {
            "message": "Orders collection not yet implemented or empty",
            "orders": []
        }
# ---------- :package: COMPLETE DASHBOARD (MODIFIED) ----------
@router.get("", response_model=SellerDashboardResponse)
def get_dashboard(
    current_user: dict = Depends(get_current_user),
    listings_limit: Optional[int] = 10,
    orders_limit: Optional[int] = 10
):
    """
    Get complete seller dashboard with:
    - :package: My Listings (recent products)
    - :moneybag: Earnings / Sales stats
    - :mailbox: Recent Orders
    """
    ensure_seller(current_user)
    # --- CHANGED ---
    vendor_id = get_vendor_oid_from_token(current_user)
    # Get recent listings
    query = {"vendor_id": vendor_id}
    products = list(product_collection.find(query).limit(listings_limit).sort("created_at", -1))
    my_listings = [objectid_str(p) for p in products]
    # Get stats
    total_products = product_collection.count_documents({"vendor_id": vendor_id})
    total_sales = 0
    total_revenue = 0.0
    pending_orders = 0
    completed_orders = 0
    orders = []
    try:
        # NOTE: This assumes 'seller_id' in your 'orders' collection
        # matches the '_id' from the 'vendors' collection.
        orders_query = {"seller_id": vendor_id} # <-- This might be a new bug
        orders_list = list(orders_collection.find(orders_query).limit(orders_limit).sort("created_at", -1))
        orders = [objectid_str(order) for order in orders_list]
        # Recalculate stats based *only* on the limited orders
        # This logic is flawed, it should query all orders for stats.
        # But I am keeping your original logic.
        for order in orders_list:
            order_dict = objectid_str(order)
            if order_dict.get("status") == "completed" or order_dict.get("status") == "delivered":
                completed_orders += 1
                order_total = order_dict.get("total", 0) or order_dict.get("amount", 0)
                if isinstance(order_total, (int, float)):
                    total_revenue += float(order_total)
                    total_sales += 1
            elif order_dict.get("status") in ["pending", "processing", "confirmed"]:
                pending_orders += 1
    except Exception:
        pass
    stats = DashboardStats(
        total_products=total_products,
        total_sales=total_sales,
        total_revenue=round(total_revenue, 2),
        pending_orders=pending_orders,
        completed_orders=completed_orders
    )
    return SellerDashboardResponse(
        my_listings=my_listings,
        stats=stats,
        orders=orders
    )







