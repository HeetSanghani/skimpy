from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from bson import ObjectId
from typing import List, Optional, Union
from datetime import datetime
import os, shutil, uuid, json
from ....db.mongodb import cate_db, delivery_addresses_collection, user_collection
from ....schemas.product import ProductResponse, ProductCondition
from app.core.security import get_current_user
from app.services.image_upload import upload_image_to_imgbb


router = APIRouter(prefix="/Product", tags=["Products"])

# Collections
product_collection = cate_db.products


# ---------- Helpers ----------
def objectid_str(doc):
    """Convert ObjectId fields to strings for JSON response."""
    doc["_id"] = str(doc["_id"])
    if "category_id" in doc:
        doc["category_id"] = str(doc["category_id"])
    if "vendor_id" in doc and doc["vendor_id"] is not None:
        doc["vendor_id"] = str(doc["vendor_id"])
    return doc


def validate_objectid(id_str: str) -> ObjectId:
    """Validate and convert string to ObjectId."""
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ObjectId")
    return ObjectId(id_str)


def save_images(files: Union[List[UploadFile], UploadFile, None]) -> List[str]:
    """Upload images to ImgBB and return their URLs."""
    image_urls: List[str] = []
    if not files:
        return image_urls
    if isinstance(files, UploadFile):
        files = [files]
    for file in files:
        # Read bytes and upload to ImgBB
        file_bytes = file.file.read()
        if not file_bytes:
            continue
        url, _ = upload_image_to_imgbb(file_bytes)
        image_urls.append(url)
    return image_urls


# ---------- CREATE PRODUCT ----------
# ---------- HELPER: Get Vendor for User ----------
def get_current_vendor_or_403(user_id: str):
    vendor = cate_db.vendors.find_one({"user_id": user_id})
    if not vendor:
        raise HTTPException(status_code=403, detail="You must be a registered seller to perform this action.")
    return vendor

# ---------- CREATE PRODUCT ----------
@router.post("", response_model=ProductResponse)
async def create_product(
    category_id: str = Form(..., description="Category ID"),
    product_name: str = Form(..., description="Product Name"),
    description: Optional[str] = Form("", description="Description"),
    price: float = Form(..., description="Price"),
    stock: int = Form(..., description="Stock"),
    product_condition: ProductCondition = Form(ProductCondition.NEW, description="Condition"),
    brand: Optional[str] = Form(None, description="Brand"),
    extra_fields: Optional[str] = Form(None, description="JSON string of extra category-specific fields, e.g. '{\"capacity_ml\": 250}'"),
    # vendor_id is ignored from input, strictly sourced from auth
    files: Optional[List[UploadFile]] = File(None, description="Images"),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["user_id"])
    vendor = get_current_vendor_or_403(user_id)
    vendor_oid = vendor["_id"]

    category_oid = validate_objectid(category_id)
    if not cate_db.categories.find_one({"_id": category_oid}):
        raise HTTPException(status_code=404, detail="Category not found")

    product_dict = {
        "product_name": product_name,
        "description": description,
        "price": price,
        "stock": stock,
        "product_condition": product_condition.value,
        "brand": brand,
        "category_id": category_oid,
        "vendor_id": vendor_oid,
        "images": save_images(files),
        "created_at": datetime.utcnow(),
        "updated_at": None
    }

    # Merge any extra category-specific fields (e.g. pottery dimensions)
    if extra_fields:
        try:
            import json
            parsed_extra = json.loads(extra_fields)
            if isinstance(parsed_extra, dict):
                product_dict.update(parsed_extra)
        except Exception:
            pass  # Silently ignore malformed JSON

    result = product_collection.insert_one(product_dict)
    new_product = product_collection.find_one({"_id": result.inserted_id})
    return objectid_str(new_product)


# ---------- GET ALL PRODUCTS ----------
@router.get("/", response_model=List[ProductResponse])
def list_product(vendor: Optional[bool] = None):
    query = {}
    if vendor is True:
        query = {"vendor_id": {"$nin": [None, ""]}}
    elif vendor is False:
        query = {"$or": [{"vendor_id": None}, {"vendor_id": ""}]}

    products = [objectid_str(p) for p in product_collection.find(query)]
    return products

# ... (Get by Vendor/Category/ID remains same) ...
# Assuming lines 132-248 are unchanged, skipping them in replacement chunk if possible
# BUT replace_file_content replaces a contiguous block.
# To avoid large replace errors, I will focus on updating CREATE, UPDATE, DELETE individually if they were spread out.
# However, here I have a chunk from 54 to 301 (Create...Delete).
# I will break this down or be very careful. 
# The original file has Create at 54, Get at 114, Update at 252, Delete at 292.
# I should use multi_replace for safety or do them one by one. I'll use multi_replace to be safe and precise.

# Actually, I'll return and simplify. I'll use `replace_file_content` for Create, then Update, then Delete.
# This tool call is for CREATE only.

# (Cancelling this big block replacement plan)
# Returning shorter block for CREATE only.



# ---------- GET ALL PRODUCTS ----------
@router.get("/", response_model=List[ProductResponse])
def list_product(vendor: Optional[bool] = None):
    """
    Get all products.  
    Use query param:
    - **vendor=true** → Only products with a vendor  
    - **vendor=false** → Only products without vendor
    """
    query = {}
    if vendor is True:
        query = {"vendor_id": {"$nin": [None, ""]}}
    elif vendor is False:
        query = {"$or": [{"vendor_id": None}, {"vendor_id": ""}]}

    products = [objectid_str(p) for p in product_collection.find(query)]
    return products

# ---------- GET PRODUCTS BY VENDOR ----------
@router.get("/by-vendor/{vendor_id}", response_model=List[ProductResponse])
def list_products_by_vendor(vendor_id: str):
    """
    List products that belong to a specific vendor.
    Accepts Vendor ObjectId OR Seller User ID.
    """
    v_doc = None
    
    # 1. Try finding vendor by ObjectId
    if ObjectId.is_valid(vendor_id):
        v_doc = cate_db.vendors.find_one({"_id": ObjectId(vendor_id)})
        
    # 2. If not found, try finding vendor by User ID
    if not v_doc:
        v_doc = cate_db.vendors.find_one({"user_id": vendor_id})
        
    if not v_doc:
        return []
        
    # Query products using the resolved Vendor ObjectId
    products_cursor = product_collection.find({"vendor_id": v_doc["_id"]})
    return [objectid_str(p) for p in products_cursor]

# ---------- GET PRODUCTS BY CATEGORY SLUG (including descendants) ----------
@router.get("/Category", response_model=List[ProductResponse])
def list_products_by_category(slug: str):
    """
    List products for a given category slug. Includes all descendant categories.
    Example: slug="thrift/clothes/shirt" → returns products in that category and its children.
    """
    # Find the category by exact slug
    category = cate_db.categories.find_one({"slug": slug})
    if not category:
        return []

    # Collect all descendant categories recursively
    def get_all_children(parent_ids):
        children = list(cate_db.categories.find({
            "$or": [
                {"parent_id": {"$in": parent_ids}},
                {"parent_id": {"$in": [str(pid) for pid in parent_ids]}}
            ]
        }))
        if not children:
            return []
        child_ids = [c["_id"] for c in children]
        return children + get_all_children(child_ids)

    all_children = get_all_children([category["_id"]])

    # Prepare list of ObjectIds to query products.category_id
    category_ids = [category["_id"]] + [c["_id"] for c in all_children]

    # Fetch products whose category_id is in this set
    products_cursor = product_collection.find({
        "category_id": {"$in": category_ids}
    })

    products = [objectid_str(p) for p in products_cursor]
    return products

# ---------- GET SINGLE PRODUCT ----------
@router.get("/{product_id}")
def get_product(product_id: str):
    product = product_collection.find_one({"_id": validate_objectid(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ✅ Safe conversion: handle ObjectId type for vendor_id and category_id
    vendor_id = None
    if "vendor_id" in product:
        vendor_value = product["vendor_id"]
        vendor_id = str(vendor_value) if isinstance(vendor_value, ObjectId) else vendor_value

    category_id = None
    if "category_id" in product:
        category_value = product["category_id"]
        category_id = str(category_value) if isinstance(category_value, ObjectId) else category_value

    # Optionally expand vendor details
    vendor_data = None
    if vendor_id:
        try:
            vdoc = cate_db.vendors.find_one({"_id": ObjectId(vendor_id)})
            if vdoc:
                # Fetch delivery address
                vendor_address = vdoc.get("address")
                user_id = vdoc.get("user_id")
                if user_id:
                    delivery_addr = delivery_addresses_collection.find_one({"user_id": str(user_id)})
                    if delivery_addr:
                        # Format: Street, City, State - Postcode
                        parts = [
                            delivery_addr.get("street_address"),
                            delivery_addr.get("city"),
                            delivery_addr.get("state"),
                            str(delivery_addr.get("postcode", ""))
                        ]
                        vendor_address = ", ".join([p for p in parts if p])

                # Fallback to User Avatar if Vendor Image is missing
                vendor_image = vdoc.get("image")
                if not vendor_image and user_id:
                     user = user_collection.find_one({"user_id": str(user_id)}, {"avatar": 1})
                     if user:
                        vendor_image = user.get("avatar")

                vendor_data = {
                    "id": str(vdoc.get("_id")),
                    "user_id": vdoc.get("user_id"),
                    "shop_name": vdoc.get("shop_name"),
                    "address": vendor_address,
                    "shop_description": vdoc.get("shop_description"),
                    "image": vendor_image,
                }
        except Exception:
            pass

    # Fetch live stock from SQL
    try:
        from app.db.session import SessionLocal
        from app.db.models.product import Product as SQLProduct
        db = SessionLocal()
        sql_p = db.query(SQLProduct).filter(SQLProduct.mongo_id == str(product_id)).first()
        if sql_p:
            product["stock"] = sql_p.stock # Truth from SQL
        db.close()
    except Exception as e:
        print(f"SQL Stock Fetch Failed: {e}")

    return {
        "id": str(product["_id"]),
        "_id": str(product["_id"]),
        # Both keys so frontend can read by either name
        "product_name": product.get("product_name") or product.get("name") or "Untitled Product",
        "name": product.get("product_name") or product.get("name") or "Untitled Product",
        "description": product.get("description", ""),
        "price": product.get("price"),
        "stock": product.get("stock"),
        # Both keys for condition too
        "product_condition": product.get("product_condition") or product.get("condition") or "NEW",
        "condition": product.get("product_condition") or product.get("condition") or "NEW",
        "brand": product.get("brand"),
        "images": product.get("images", []),
        "category_id": category_id,
        "vendor_id": vendor_id,
        "vendor": vendor_data,
    }



# ---------- UPDATE PRODUCT ----------
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    category_id: Optional[str] = Form(None, description="New category ID", example="670e8b3f111111111"),
    product_name: Optional[str] = Form(None, description="Updated product name", example="Men's Black T-Shirt"),
    description: Optional[str] = Form(None, description="Updated description", example="Now in black color with soft cotton fabric"),
    price: Optional[float] = Form(None, description="Updated price", example=549.99),
    stock: Optional[int] = Form(None, description="Updated stock quantity", example=120),
    product_condition: Optional[ProductCondition] = Form(None, description="Updated product condition (new/used/refurbished)"),
    brand: Optional[str] = Form(None, description="Updated brand name", example="Nike"),
    vendor_id: Optional[str] = Form(None, description="Updated vendor ID", example="670e8b3f111111112"),
    files: Optional[List[UploadFile]] = File(None, description="Upload additional product images"),
    delete_image_urls: Optional[str] = Form(None, description='JSON list of image URLs to delete'),
    current_user: dict = Depends(get_current_user)
):
    """
    Update product details or add new images.
    """
    user_id = str(current_user["user_id"])
    vendor_doc = get_current_vendor_or_403(user_id)
    
    product_oid = validate_objectid(product_id)
    product = product_collection.find_one({"_id": product_oid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # OWNERSHIP CHECK
    if str(product.get("vendor_id")) != str(vendor_doc["_id"]):
        raise HTTPException(status_code=403, detail="You do not own this product")

    update_fields = {"updated_at": datetime.utcnow()}
    if category_id: update_fields["category_id"] = validate_objectid(category_id)
    if product_name: update_fields["product_name"] = product_name
    if description: update_fields["description"] = description
    if price is not None: update_fields["price"] = price
    if stock is not None: 
        update_fields["stock"] = stock
        # Sync to variants if stock is being set to 0 (Out of Stock)
        # Or if we want to enforce parent-level control.
        # For now, if stock is 0, zero out variants to ensure they don't show as available.
        if stock == 0:
            from app.db.mongodb import variant_collection
            variant_collection.update_many(
                {"product_id": str(product_id)},
                {"$set": {"stock": 0}}
            )
    if product_condition: update_fields["product_condition"] = product_condition.value
    if brand is not None: update_fields["brand"] = brand
    # Prevent vendor_id change unless we really want transfer of ownership (usually no)
    # if vendor_id: update_fields["vendor_id"] = validate_objectid(vendor_id) 
    
    # Handle Image Deletion
    current_images = product.get("images", [])
    if delete_image_urls:
        try:
            urls_to_delete = json.loads(delete_image_urls)
            if isinstance(urls_to_delete, list):
                current_images = [img for img in current_images if img not in urls_to_delete]
                # Force update if deletion occurred
                update_fields["images"] = current_images 
        except Exception:
            pass # ignore invalid json

    if files:
        update_fields["images"] = current_images + save_images(files)

    # SYNC TO SQL
    try:
        from app.db.session import SessionLocal
        from app.db.models.product import Product as SQLProduct
        db = SessionLocal()
        
        # Find or Create SQL Product
        sql_p = db.query(SQLProduct).filter(SQLProduct.mongo_id == product_id).first()
        if not sql_p:
            sql_p = SQLProduct(
                mongo_id=product_id,
                product_name=product.get("product_name", "Unknown"),
                price=product.get("price", 0),
                stock=product.get("stock", 0)
            )
            db.add(sql_p)
        
        # Update fields if present in input
        if stock is not None: sql_p.stock = stock
        if price is not None: sql_p.price = price
        if product_name: sql_p.product_name = product_name
        
        db.commit()
        db.close()
    except Exception as e:
        print(f"SQL Sync Failed: {e}")

    product_collection.update_one({"_id": product_oid}, {"$set": update_fields})
    updated_product = product_collection.find_one({"_id": product_oid})
    return objectid_str(updated_product)


# ---------- DELETE PRODUCT ----------
@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a product by its ID.
    """
    user_id = str(current_user["user_id"])
    vendor_doc = get_current_vendor_or_403(user_id)

    product_oid = validate_objectid(product_id)
    product = product_collection.find_one({"_id": product_oid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # OWNERSHIP CHECK
    if str(product.get("vendor_id")) != str(vendor_doc["_id"]):
        raise HTTPException(status_code=403, detail="You do not own this product")

    result = product_collection.delete_one({"_id": product_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}















































