from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from ....db.mongodb import cate_db, user_db
from ....schemas.dashboard import SellerDashboardResponse, DashboardStats
from ....schemas.product import ProductResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/seller/dashboard", tags=["Seller Dashboard"])

# Collections
product_collection = cate_db.products
# Fixed: Use cate_db.orders to match orders.py where orders are actually created
orders_collection = cate_db.orders 

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

# ---------- :package: MY LISTINGS ----------
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
    
    # We now get the complex vendor ID
    vendor_id = get_vendor_oid_from_token(current_user)
    
    query = {"vendor_id": vendor_id}
    products = list(product_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
    
    # Attach variants to each product
    results = []
    for p in products:
        p_data = objectid_str(p)
        # Fetch variants - Try both string and ObjectId
        p_id = p["_id"]
        v_query = {"$or": [{"product_id": str(p_id)}, {"product_id": p_id}]}
        if ObjectId.is_valid(p_id):
             v_query["$or"].append({"product_id": ObjectId(p_id)})
             
        variants = list(cate_db.variants.find(v_query))
        p_data["variants"] = [objectid_str(v) for v in variants]
        results.append(p_data)
    
    return results

# ---------- :moneybag: EARNINGS / SALES ----------
@router.get("/earnings", response_model=DashboardStats)
def get_earnings_and_sales(current_user: dict = Depends(get_current_user)):
    """
    :moneybag: Get earnings and sales statistics for the current seller.
    Returns total products, total sales, total revenue, and order statistics.
    """
    ensure_seller(current_user)
    
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
        # Fixed: Use vendor_id (string) to match orders.py structure
        orders_query = {"vendor_id": str(vendor_id)}
        orders = list(orders_collection.find(orders_query))
        
        for order in orders:
            order = objectid_str(order)
            status = str(order.get("status", "")).lower()
            
            # Calculate revenue from completed orders
            if status in ["completed", "delivered"]:
                completed_orders += 1
                order_total = order.get("total_amount", 0) or order.get("total", 0) or order.get("amount", 0)
                if isinstance(order_total, (int, float)):
                    total_revenue += float(order_total)
                    total_sales += 1
            # Pending statuses
            elif status in ["pending", "processing", "confirmed", "shipped", "pending priority approval"]:
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

# ---------- :mailbox: ORDERS ----------
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
    
    vendor_id = get_vendor_oid_from_token(current_user)
    print(f"DEBUG: get_my_orders - Vendor OID: {vendor_id}, Type: {type(vendor_id)}")
    
    # Fixed: Use vendor_id (string) as used in orders.py
    query = {"vendor_id": str(vendor_id)}
    
    if status is not None and status != "":
        status_lower = status.lower()
        if status_lower == "pending":
            # Match "Pending" OR "Pending Priority Approval"
            query["status"] = {"$in": ["Pending", "Pending Priority Approval", "pending"]}
        elif status_lower == "processing":
            # Match "Processing" OR "Approved" (Since approved usually means ready to process)
            query["status"] = {"$in": ["Processing", "Approved", "processing"]}
        elif status_lower == "completed":
             # Match "Completed" OR "Delivered" if needed, but usually just Completed
             query["status"] = {"$regex": "^Completed", "$options": "i"}
        else:
            # Fallback for others (cancelled, delivered, shipped)
            query["status"] = {"$regex": f"^{status}$", "$options": "i"}
        
    print(f"DEBUG: get_my_orders - Query: {query}")

    orders = list(orders_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
    print(f"DEBUG: get_my_orders - Found {len(orders)} orders")
    
    return [objectid_str(order) for order in orders]

# ---------- :package: COMPLETE DASHBOARD ----------
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
    
    vendor_id = get_vendor_oid_from_token(current_user)
    
    # Get recent listings
    query = {"vendor_id": vendor_id}
    products_cursor = list(product_collection.find(query).limit(listings_limit).sort("created_at", -1))
    
    my_listings = []
    for p in products_cursor:
        p_data = objectid_str(p)
        # Fetch variants - Try both string and ObjectId
        p_id = p["_id"]
        v_query = {"$or": [{"product_id": str(p_id)}, {"product_id": p_id}]}
        if ObjectId.is_valid(p_id):
             v_query["$or"].append({"product_id": ObjectId(p_id)})

        variants = list(cate_db.variants.find(v_query))
        p_data["variants"] = [objectid_str(v) for v in variants]
        my_listings.append(p_data)
    
    # Get Stats (same logic as earnings endpoint)
    total_products = product_collection.count_documents({"vendor_id": vendor_id})
    total_sales = 0
    total_revenue = 0.0
    pending_orders = 0
    completed_orders = 0
    
    orders = []
    try:
        # Fixed: query by vendor_id string
        orders_query = {"vendor_id": str(vendor_id)}
        
        # Get ALL orders for stats
        all_orders = list(orders_collection.find(orders_query).sort("created_at", -1))
        
        for order in all_orders:
            order_dict = objectid_str(order)
            status = str(order_dict.get("status", "")).lower()
            
            if status in ["completed", "delivered"]:
                completed_orders += 1
                order_total = order_dict.get("total_amount", 0) or order_dict.get("total", 0) or order_dict.get("amount", 0)
                if isinstance(order_total, (int, float)):
                    total_revenue += float(order_total)
                    total_sales += 1
            elif status in ["pending", "processing", "confirmed", "shipped", "pending priority approval"]:
                pending_orders += 1
                
        # Slice for the response list
        orders_list = all_orders[:orders_limit]
        orders = [objectid_str(order) for order in orders_list]
        
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
