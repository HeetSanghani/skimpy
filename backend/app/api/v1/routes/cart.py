from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from ....db.mongodb import user_db, cate_db
from app.core.security import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])

# Collections
cart_collection = user_db.cart
# Use the same collection name as products.py uses
product_collection = cate_db.products
variant_collection = cate_db.variants


# ---------- Helpers ----------
def objectid_str(doc):
    """Convert ObjectId fields to strings for JSON response."""
    if not doc:
        return doc
    if isinstance(doc, ObjectId):
        return str(doc)
    if not isinstance(doc, dict):
        return doc
    
    doc = doc.copy()
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc and doc["user_id"]:
        doc["user_id"] = str(doc["user_id"])
    if "product_id" in doc and doc["product_id"]:
        doc["product_id"] = str(doc["product_id"])
    if "variant_id" in doc and doc["variant_id"]:
        doc["variant_id"] = str(doc["variant_id"])
    if "category_id" in doc and doc["category_id"]:
        doc["category_id"] = str(doc["category_id"])
    if "vendor_id" in doc and doc["vendor_id"]:
        doc["vendor_id"] = str(doc["vendor_id"])
    return doc


def deep_objectid_str(doc):
    """Recursively convert all ObjectIds to strings in a document."""
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = deep_objectid_str(value)
            elif isinstance(value, list):
                result[key] = [deep_objectid_str(item) for item in value]
            else:
                result[key] = value
        return result
    if isinstance(doc, list):
        return [deep_objectid_str(item) for item in doc]
    return doc


def validate_objectid(id_str: str) -> ObjectId:
    """Validate and convert string to ObjectId."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")


# ---------- Request Models ----------
class AddToCartRequest(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1


class UpdateCartRequest(BaseModel):
    quantity: int


# ---------- GET CART ITEMS ----------
@router.get("")
async def get_cart_items(current_user: dict = Depends(get_current_user)):
    """Get all cart items for the current user."""
    user_id = str(current_user["user_id"])
    
    cart_items = list(cart_collection.find({"user_id": user_id}))
    
    # Enrich cart items with product and variant details
    enriched_items = []
    for item in cart_items:
        product_id = item.get("product_id")
        variant_id = item.get("variant_id")
        
        product = None
        variant = None
        
        if product_id:
            try:
                product = product_collection.find_one({"_id": validate_objectid(product_id)})
                if product:
                    product = deep_objectid_str(product)
            except:
                pass
        
        if variant_id:
            try:
                variant = variant_collection.find_one({"_id": validate_objectid(variant_id)})
                if variant:
                    variant = deep_objectid_str(variant)
            except:
                pass
        
        enriched_item = objectid_str(item)
        enriched_item["product"] = product
        enriched_item["variant"] = variant
        enriched_items.append(enriched_item)
    
    return enriched_items


# ---------- ADD TO CART ----------
@router.post("")
async def add_to_cart(
    request: AddToCartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a product/variant to cart."""
    user_id = str(current_user["user_id"])
    product_id = request.product_id
    variant_id = request.variant_id
    quantity = request.quantity
    
    # Validate product exists
    try:
        product_obj_id = validate_objectid(product_id)
        product = product_collection.find_one({"_id": product_obj_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    # Validate variant if provided
    variant_obj_id = None
    if variant_id:
        try:
            variant_obj_id = validate_objectid(variant_id)
            variant = variant_collection.find_one({"_id": variant_obj_id})
            if not variant:
                raise HTTPException(status_code=404, detail="Variant not found")
        except:
            raise HTTPException(status_code=400, detail="Invalid variant ID")
    
    # Check if item already exists in cart
    query = {"user_id": user_id, "product_id": product_id}
    if variant_id:
        query["variant_id"] = variant_id
    else:
        query["variant_id"] = None
    
    existing_item = cart_collection.find_one(query)
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item.get("quantity", 0) + quantity
        cart_collection.update_one(
            {"_id": existing_item["_id"]},
            {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Cart item updated", "cart_item_id": str(existing_item["_id"])}
    else:
        # Create new cart item
        new_item = {
            "user_id": user_id,
            "product_id": product_id,
            "variant_id": variant_id if variant_id else None,
            "quantity": quantity,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = cart_collection.insert_one(new_item)
        return {"message": "Item added to cart", "cart_item_id": str(result.inserted_id)}


# ---------- UPDATE CART ITEM QUANTITY ----------
@router.put("/{cart_item_id}")
async def update_cart_item(
    cart_item_id: str,
    request: UpdateCartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the quantity of a cart item."""
    user_id = str(current_user["user_id"])
    quantity = request.quantity
    
    try:
        cart_obj_id = validate_objectid(cart_item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid cart item ID")
    
    cart_item = cart_collection.find_one({"_id": cart_obj_id, "user_id": user_id})
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    cart_collection.update_one(
        {"_id": cart_obj_id},
        {"$set": {"quantity": quantity, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Cart item updated"}


# ---------- REMOVE FROM CART ----------
@router.delete("/{cart_item_id}")
async def remove_from_cart(
    cart_item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove an item from cart."""
    user_id = str(current_user["user_id"])
    
    try:
        cart_obj_id = validate_objectid(cart_item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid cart item ID")
    
    result = cart_collection.delete_one({"_id": cart_obj_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Item removed from cart"}


# ---------- CLEAR CART ----------
@router.delete("")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear all items from user's cart."""
    user_id = str(current_user["user_id"])
    
    result = cart_collection.delete_many({"user_id": user_id})
    
    return {"message": f"Cart cleared. {result.deleted_count} items removed"}

