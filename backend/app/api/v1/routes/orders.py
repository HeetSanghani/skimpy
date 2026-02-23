from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId
import random

from app.db.mongodb import order_collection, cart_collection, product_collection, vendor_collection, user_collection, variant_collection
from app.api.v1.routes.products import validate_objectid, objectid_str
from app.utils.email_service import send_order_invoice_email
from app.core.security import get_current_user
from app.schemas.order import OrderResponse, OrderItem

router = APIRouter(prefix="/orders", tags=["Orders"])

# ---------- HELPER: Get Vendor for User ----------
def get_current_vendor_or_403(user_id: str):
    vendor = vendor_collection.find_one({"user_id": user_id})
    if not vendor:
        raise HTTPException(status_code=403, detail="You must be a registered seller to perform this action.")
    return vendor

# ---------- 1. CREATE ORDERS (From Cart/Session) ----------
@router.post("/create-from-cart", response_model=List[OrderResponse])
async def create_orders_from_cart(
    shipping_address: dict = Body(...),
    payment_id: str = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Creates orders from the user's current cart.
    Splits items by vendor and creates separate Order documents.
    Does NOT deduct stock (Stock is deducted on Vendor Approval).
    Clears cart after success.
    """
    user_id = str(current_user["user_id"])
    
    # 1. Fetch Cart Items
    cart_items = list(cart_collection.find({"user_id": user_id}))
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Group by Vendor
    orders_by_vendor: Dict[str, List[OrderItem]] = {}
    vendor_totals: Dict[str, float] = {}

    for item in cart_items:
        # Fetch product to get vendor_id and current price
        pid = item["product_id"]
        try:
            product = product_collection.find_one({"_id": ObjectId(pid)})
        except:
            continue
            
        if not product:
            continue # Skip invalid products
        
        vendor_id = str(product.get("vendor_id"))
        if not vendor_id:
            vendor_id = "admin" # Fallback if no vendor
        
        # Deduct Stock (Optimistic Locking)
        # We decrement ONLY if stock >= quantity
        # If product has variants, stock logic might be complex, but assuming simple product stock for now per user request.
        # If variant_id exists, we should deduct from variant collection too or instead.
        
        request_qty = item.get("quantity", 1)
        
        if item.get("variant_id"):
             # Deduct from Variant
             vid = ObjectId(item["variant_id"])
             result = variant_collection.update_one(
                 {"_id": vid, "stock": {"$gte": request_qty}},
                 {"$inc": {"stock": -request_qty}}
             )
             if result.modified_count == 0:
                  raise HTTPException(status_code=400, detail=f"Insufficient stock for variant of {product.get('product_name')}")
        else:
             # Deduct from Product
             result = product_collection.update_one(
                 {"_id": pid, "stock": {"$gte": request_qty}},
                 {"$inc": {"stock": -request_qty}}
             )
             if result.modified_count == 0:
                  raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.get('product_name')}")

        # Create Order Item
        order_item = OrderItem(
            product_id=str(pid),
            variant_id=str(item.get("variant_id")) if item.get("variant_id") else None,
            name=product.get("product_name"),
            price=product.get("price", 0),
            quantity=item.get("quantity", 1),
            image=product.get("image") or (product.get("images")[0] if product.get("images") else None)
        )
        
        if vendor_id not in orders_by_vendor:
            orders_by_vendor[vendor_id] = []
            vendor_totals[vendor_id] = 0.0
            
        orders_by_vendor[vendor_id].append(order_item)
        vendor_totals[vendor_id] += (order_item.price * order_item.quantity)

    # 3. Create Order Documents
    created_orders = []
    timestamp = datetime.utcnow()
    
    for vendor_id, items in orders_by_vendor.items():
        rand_suffix = random.randint(1000, 9999)
        readable_order_id = f"ORD-{int(timestamp.timestamp())}-{rand_suffix}"
        
        order_doc = {
            "user_id": user_id,
            "vendor_id": vendor_id, 
            "seller_id": vendor_id, # Keep for compatibility
            "order_id": readable_order_id,
            "payment_id": payment_id,
            "products": [i.dict() for i in items],
            "total_amount": vendor_totals[vendor_id],
            "status": "Pending Priority Approval",
            "shipping_address": shipping_address,
            "payment_status": "Paid",
            "created_at": timestamp,
            "updated_at": timestamp
        }
        res = order_collection.insert_one(order_doc)
        new_order = order_collection.find_one({"_id": res.inserted_id})
        created_orders.append(objectid_str(new_order))



    # 4. Trigger n8n Order Success Notification
    try:
        grand_total = sum(vendor_totals.values())
        all_products = []
        
        for v_items in orders_by_vendor.values():
            for item in v_items:
                all_products.append({
                    "name": item.name,
                    "quantity": item.quantity,
                    "price": item.price,
                    "image": item.image
                })

        user_data = {
            "user_id": user_id,
            "email": current_user.get("email"),
            "name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip()
        }
        
        # Extract order IDs as strings to avoid JSON serialization errors with datetime objects
        order_id_strings = [o["order_id"] for o in created_orders]

        # Helper for dates
        from datetime import timedelta
        order_date_str = timestamp.strftime("%Y-%m-%d")
        delivery_date_str = (timestamp + timedelta(days=5)).strftime("%Y-%m-%d") # Estimated

        order_summary = {
             "total_amount": grand_total,
             "order_ids": order_id_strings,
             "products": all_products,
             "payment_id": payment_id,
             "shipping_address": shipping_address,
             "order_date": order_date_str,
             "delivery_date": delivery_date_str,
             "payment_status": "Paid",
             "shop_name": "Skimpy Store",
             "shop_address": "Ahmedabad, Gujarat, India",
             "support_contact": "support@skimpy.com"
        }
        
        send_order_invoice_email(user_data, order_summary)
    except Exception as e:
        print(f"Failed to trigger order webhook: {e}")

    # 5. Clear Cart
    cart_collection.delete_many({"user_id": user_id})

    return created_orders

# ---------- 2. GET USER ORDERS ----------
@router.get("/user", response_model=List[OrderResponse])
def get_user_orders(
    current_user: dict = Depends(get_current_user),
    limit: int = 100, 
    skip: int = 0
):
    user_id = str(current_user["user_id"])
    orders = list(order_collection.find({"user_id": user_id})
                  .sort("created_at", -1)
                  .skip(skip)
                  .limit(limit))
    return [objectid_str(o) for o in orders]

# ---------- 4. GET VENDOR ORDERS ----------
@router.get("/vendor", response_model=List[OrderResponse])
def get_vendor_orders(
    current_user: dict = Depends(get_current_user),
    limit: int = 100,
    skip: int = 0
):
    user_id = str(current_user["user_id"])
    vendor = get_current_vendor_or_403(user_id)
    vendor_id = str(vendor["_id"])
    
    orders = list(order_collection.find({"vendor_id": vendor_id})
                  .sort("created_at", -1)
                  .skip(skip)
                  .limit(limit))
    return [objectid_str(o) for o in orders]

# ---------- 3. GET ORDER BY ID (New) ----------
@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["user_id"])
    
    # Try by _id first, then by order_id string
    query = {"user_id": user_id}
    
    if ObjectId.is_valid(order_id):
         # It could be an ObjectID OR a string that looks like one?
         # Safer to query with $or
         or_conditions = [{"_id": ObjectId(order_id)}, {"order_id": order_id}]
    else:
         or_conditions = [{"order_id": order_id}]
         
    query["$or"] = or_conditions
        
    order = order_collection.find_one(query)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    return objectid_str(order)

# ---------- 5. UPDATE STATUS (Vendor Action) ----------
@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    status: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["user_id"])
    vendor = get_current_vendor_or_403(user_id)
    
    oid = validate_objectid(order_id)
    order = order_collection.find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if str(order.get("vendor_id")) != str(vendor["_id"]):
         if str(order.get("seller_id")) != str(vendor["_id"]):
             raise HTTPException(status_code=403, detail="You do not own this order")

    current_status = order.get("status")
    
    if status == "Approved" and current_status != "Approved":
        # Stock is already deducted at payment time (create_checkout_session / webhook)
        # So we just update the status here. 
        pass
            
    elif status == "Rejected" and current_status == "Approved":
        # If we reject an APPROVED order, we might want to restock?
        # But wait, usually we reject "Pending" orders.
        # If we reject a Pending order (which already has stock deducted), we MUST RESTOCK.
        pass 
        
    # LOGIC CORRECTION:
    # All orders created via Payment have stock deducted.
    # So if we Reject/Cancel ANY order (Pending or Approved), we should RESTOCK.
    if status in ["Rejected", "Cancelled"] and current_status not in ["Rejected", "Cancelled"]:
         for item in order["products"]:
            qty = item["quantity"]
            # Restore to Variant if exists
            if item.get("variant_id"):
                try:
                    vid = ObjectId(item["variant_id"])
                    variant_collection.update_one({"_id": vid}, {"$inc": {"stock": qty}})
                except: pass
            
            # Also Restore to Product (or simple product)
            # If variant_id exists, do we restore to product? 
            # In our deduction logic, we deducted from EITHER variant OR product.
            # So here we should restore to EITHER variant OR product.
            
            pid = ObjectId(item["product_id"])
            if not item.get("variant_id"):
                 product_collection.update_one({"_id": pid}, {"$inc": {"stock": qty}})

    order_collection.update_one(
        {"_id": oid},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    updated_order = order_collection.find_one({"_id": oid})
    print(f"Update Success: {oid} -> {status}")
    return objectid_str(updated_order)
