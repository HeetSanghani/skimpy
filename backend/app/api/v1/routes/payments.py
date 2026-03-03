from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import stripe
import os

router = APIRouter(prefix="/payment", tags=["Payment"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
from ....db.mongodb import cate_db, user_collection
from app.security.dependencies import get_current_user
from fastapi import Depends
from bson import ObjectId

# Collections
product_collection = cate_db.products
variant_collection = cate_db.variants

# Frontend base URL for redirect after Stripe checkout
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://skimpy.vercel.app").rstrip("/")

# CHECKOUT REQUEST MODEL (Only IDs and Quantity)
class CheckoutItem(BaseModel):
    product_id: str
    variant_id: str | None = None
    quantity: int

class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    address_id: str  # Required selected address

@router.post("/create-checkout-session")
async def create_checkout_session(
    checkout_req: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    items = checkout_req.items
    address_id = checkout_req.address_id

    # 1. Validate User Profile
    user_id = str(current_user["user_id"])
    user_doc = user_collection.find_one({"user_id": user_id})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
        
    required_fields = ["phone", "DOB", "gender"] # Basic fields (avatar optional)
    missing = [f for f in required_fields if not user_doc.get(f)]
    
    if missing:
        raise HTTPException(status_code=403, detail=f"Incomplete profile. Missing: {', '.join(missing)}")
        
    # Validate Address ID
    # We use custom address_id string (ADDR-...), not ObjectId
    from ....db.mongodb import delivery_addresses_collection
    
    # Check if address exists using the custom ID
    addr_doc = delivery_addresses_collection.find_one({
        "address_id": address_id, 
        "user_id": user_id
    })
    
    if not addr_doc:
         # Fallback: try ObjectId just in case legacy data exists, though unlikely given logic
         try:
             addr_doc = delivery_addresses_collection.find_one({"_id": ObjectId(address_id), "user_id": user_id})
         except:
             pass
             
    if not addr_doc:
         raise HTTPException(status_code=400, detail="Invalid delivery address selected.")

    line_items = []
    
    for item in items:
        # Validate ID
        try:
            pid = ObjectId(item.product_id)
        except:
            raise HTTPException(status_code=400, detail=f"Invalid product ID: {item.product_id}")
            
        product = product_collection.find_one({"_id": pid})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
            
        # Determine Price & Name
        unit_amount = product.get("price", 0)
        product_name = product.get("product_name", "Unknown Product")
        image_url = product.get("images", [""])[0] if product.get("images") else ""
        
        # Handle Variant (If applicable)
        if item.variant_id:
            try:
                vid = ObjectId(item.variant_id)
                variant = variant_collection.find_one({"_id": vid})
                if variant:
                    if "price" in variant:
                        unit_amount = variant["price"]
            except:
                pass # Ignore invalid variant ID, fallback to product
        
        # Determine correct stock to check
        available_stock = product.get("stock", 0)
        stock_source = product_name
        
        if item.variant_id:
             try:
                 vid = ObjectId(item.variant_id)
                 variant = variant_collection.find_one({"_id": vid})
                 if variant and "stock" in variant:
                      available_stock = variant["stock"]
                      stock_source = f"{product_name} ({variant.get('size') or variant.get('name') or 'variant'})"
             except:
                 pass

        if available_stock < item.quantity:
             raise HTTPException(status_code=400, detail=f"Insufficient stock for {stock_source}. Only {available_stock} left.")

        line_items.append({
            "price_data": {
                "currency": "inr",
                "unit_amount": int(unit_amount * 100),
                "product_data": {
                    "name": product_name,
                    "images": [image_url] if image_url else [],
                    "metadata": {
                        "product_id": str(item.product_id),
                        "variant_id": str(item.variant_id) if item.variant_id else None,
                        "user_id": user_id
                    },
                },
            },
            "quantity": item.quantity,
        })

    if not line_items:
         raise HTTPException(status_code=400, detail="No valid items to checkout")

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,
            # We already collected the address in our app.
            # Passing customer_email pre-fills the email field.
            customer_email=user_doc.get("email"),
            success_url=f"{FRONTEND_URL}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment-cancel",
            client_reference_id=user_id,
            metadata={
                "selected_address_id": address_id 
            }
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- HELPER: Process Payment & Create Order ---
async def process_successful_payment(session):
    session_id = session["id"]
    user_id = session.get("client_reference_id")
    payment_intent = session.get("payment_intent")

    # 0. Idempotency Check
    # Check if order with this payment_id already exists
    order_collection = cate_db.orders
    existing = order_collection.find_one({"payment_id": payment_intent})
    if existing:
        print(f"Order for payment {payment_intent} already exists. Skipping.")
        return {"status": "already_processed"}

    # 1. Fetch Line Items with Product Metadata
    try:
        line_items = stripe.checkout.Session.list_line_items(session_id, limit=100, expand=['data.price.product'])
    except Exception as e:
        print(f"Error fetching line items: {e}")
        return {"error": "Failed to fetch items"}

    # 2. Extract Items and Group by Vendor
    from datetime import datetime
    import random
    
    # Collections
    product_collection = cate_db.products
    variant_collection = cate_db.variants
    vendor_collection = cate_db.vendors
    
    current_time = datetime.utcnow()
    shipping_details = session.get("shipping_details") or session.get("customer_details")
    
    # Check Metadata for Selected Address ID
    metadata_global = session.get("metadata", {})
    selected_addr_id = metadata_global.get("selected_address_id")
    mapped_address = {}
    
    # Strategy: Try to fetch our internal address first
    internal_address_found = False
    
    if selected_addr_id:
        from ....db.mongodb import delivery_addresses_collection
        # Try custom ID
        addr_doc = delivery_addresses_collection.find_one({"address_id": selected_addr_id})
        if not addr_doc:
             # Try ObjectId
             try: addr_doc = delivery_addresses_collection.find_one({"_id": ObjectId(selected_addr_id)})
             except: pass
        
        if addr_doc:
            internal_address_found = True
            # Map internal address to Order schema
            mapped_address = {
                "fullname": f"{addr_doc.get('first_name', '')} {addr_doc.get('last_name', '')}".strip(),
                "address_line1": addr_doc.get("street_address", ""),
                "address_line2": "", # Our schema might not have line2
                "city": addr_doc.get("city", ""),
                "state": addr_doc.get("state", ""),
                "pincode": str(addr_doc.get("postcode", "")),
                "country": addr_doc.get("country", ""),
                "phone": addr_doc.get("phone", "N/A"),
                "email": user_doc.get("email") if 'user_doc' in locals() else session.get("customer_details", {}).get("email")
            }

    # Fallback to Stripe Address if no internal address found
    if not internal_address_found:
        stripe_addr = shipping_details.get("address", {})
        mapped_address = {
            "fullname": shipping_details.get("name", "Valued Customer"),
            "address_line1": stripe_addr.get("line1", ""),
            "address_line2": stripe_addr.get("line2", ""),
            "city": stripe_addr.get("city", ""),
            "state": stripe_addr.get("state", ""),
            "pincode": stripe_addr.get("postal_code", ""),
            "country": stripe_addr.get("country", ""),
            "phone": shipping_details.get("phone") or "N/A"
        }
    vendor_orders = {} # vendor_id -> list of items
    vendor_totals = {} # vendor_id -> total amount
    processed_products = [] 

    for item in line_items["data"]:
        qty = item["quantity"]
        price_subtotal = item["amount_total"] / 100.0 
        unit_price = item["price"]["unit_amount"] / 100.0
        
        product_obj = item["price"]["product"]
        metadata = product_obj.get("metadata", {})
        
        product_id_str = metadata.get("product_id")
        variant_id_str = metadata.get("variant_id")
        
        if not product_id_str: continue
            
        try:
             db_product = product_collection.find_one({"_id": ObjectId(product_id_str)})
        except: continue
        if not db_product: continue
        
        vendor_id = str(db_product.get("vendor_id"))
        if not vendor_id: vendor_id = "admin"
        
        # --- STOCK DEDUCTION ---
        if variant_id_str:
            try:
                vid = ObjectId(variant_id_str)
                res = variant_collection.update_one(
                    {"_id": vid, "stock": {"$gte": qty}},
                    {"$inc": {"stock": -qty}}
                )
                if res.modified_count == 0:
                    print(f"WARNING: Stock deduction failed for variant {variant_id_str}")
            except: pass
        else:
            try:
                pid = ObjectId(product_id_str)
                res = product_collection.update_one(
                    {"_id": pid, "stock": {"$gte": qty}},
                    {"$inc": {"stock": -qty}}
                )
                if res.modified_count == 0:
                    print(f"WARNING: Stock deduction failed for product {product_id_str}")
            except: pass
        # -----------------------
        
        order_item = {
            "product_id": product_id_str,
            "variant_id": variant_id_str,
            "name": db_product.get("product_name"),
            "price": unit_price,
            "quantity": qty,
            "image": db_product.get("image") or (db_product.get("images")[0] if db_product.get("images") else None)
        }
        
        if vendor_id not in vendor_orders:
            vendor_orders[vendor_id] = []
            vendor_totals[vendor_id] = 0.0
        
        vendor_orders[vendor_id].append(order_item)
        vendor_totals[vendor_id] += price_subtotal
        processed_products.append(order_item)

    # 3. Create Order Documents
    created_order_ids = []
    
    for v_id, items in vendor_orders.items():
        rand_suffix = random.randint(1000, 9999)
        readable_order_id = f"ORD-{int(current_time.timestamp())}-{rand_suffix}"
        
        order_doc = {
            "user_id": user_id,
            "vendor_id": v_id,
            "seller_id": v_id,
            "order_id": readable_order_id,
            "payment_id": payment_intent,
            "products": items,
            "total_amount": vendor_totals[v_id],
            "status": "Pending Priority Approval",
            "shipping_address": mapped_address,
            "customer_details": shipping_details,
            "payment_status": "Paid",
            "created_at": current_time,
            "updated_at": current_time
        }
        
        res = order_collection.insert_one(order_doc)
        created_order_ids.append(str(res.inserted_id))
        
    print(f":white_check_mark: Created orders {created_order_ids} for user {user_id}")

    # 4. Send Order Invoice Email
    try:
        from app.utils.email_service import send_order_invoice_email
        grand_total = sum(vendor_totals.values())
        user_email = session.get("customer_details", {}).get("email")
        user_name = session.get("customer_details", {}).get("name")
        
        if not user_email:
             u_doc = user_collection.find_one({"user_id": user_id})
             if u_doc:
                 user_email = u_doc.get("email")
                 user_name = f"{u_doc.get('first_name','')} {u_doc.get('last_name','')}"

        user_data = {
            "user_id": user_id,
            "email": user_email,
            "name": user_name or "Valued Customer"
        }
        
        from datetime import timedelta
        order_date_str = current_time.strftime("%Y-%m-%d")
        delivery_date_str = (current_time + timedelta(days=5)).strftime("%Y-%m-%d")

        order_summary = {
             "total_amount": grand_total,
             "order_ids": created_order_ids,
             "products": processed_products,
             "payment_id": payment_intent,
             "shipping_address": mapped_address,
             "order_date": order_date_str,
             "delivery_date": delivery_date_str,
             "payment_status": "Paid",
             "order_status": "Pending Priority Approval", # Explicitly state status
             "shop_name": "Skimpy Store",
             "shop_address": "Ahmedabad, Gujarat, India",
             "support_contact": "support@skimpy.com"
        }
        send_order_invoice_email(user_data, order_summary)
    except Exception as e:
        print(f"Failed to trigger webhook: {e}")

    # 5. Clear User Cart
    # We must ensure we delete items for this user!
    # Double check imports: user_db is in mongodb.py
    try:
        from ....db.mongodb import cart_collection
        cart_collection.delete_many({"user_id": user_id})
        print(f"Cleared cart for user {user_id}")
    except Exception as e:
        print(f"Failed to clear cart: {e}")

    return {"status": "success", "order_ids": created_order_ids}


@router.post("/verify-session")
async def verify_session(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
        
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if session.payment_status != "paid":
        return {"status": "pending", "message": "Payment not completed yet"}
        
    # Process order
    result = await process_successful_payment(session)
    return result


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook. Verifies signature with STRIPE_WEBHOOK_SECRET."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        return JSONResponse(status_code=500, content={"error": "STRIPE_WEBHOOK_SECRET not configured"})
    if not sig_header:
        return JSONResponse(status_code=400, content={"error": "Missing stripe-signature header"})
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": f"Invalid payload: {e}"})
    except stripe.exceptions.SignatureVerificationError as e:
        return JSONResponse(status_code=400, content={"error": f"Invalid signature: {e}"})
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
        
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await process_successful_payment(session)
        
    return {"status": "success"}