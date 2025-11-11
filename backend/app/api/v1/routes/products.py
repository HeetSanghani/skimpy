from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from bson import ObjectId
from typing import List, Optional, Union
from datetime import datetime
import os, shutil, uuid
from ....db.mongodb import cate_db
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
@router.post("", response_model=ProductResponse)
async def create_product(
    category_id: str = Form(..., description="Category ID where the product belongs", example="670e8b3f111111111"),
    product_name: str = Form(..., description="Name of the product", example="Men's Blue T-Shirt"),
    description: Optional[str] = Form("", description="Detailed description of the product", example="Comfortable cotton T-shirt for daily wear"),
    price: float = Form(..., description="Base price of the product", example=499.99),
    stock: int = Form(..., description="Available stock quantity", example=100),
    product_condition: ProductCondition = Form(ProductCondition.NEW, description="Condition of the product (new/used/refurbished)"),
    brand: Optional[str] = Form(None, description="Brand name for the product", example="Nike"),
    vendor_id: Optional[str] = Form(None, description="Vendor ID (if product belongs to a specific vendor)", example="670e8b3f111111112"),
    files: Optional[List[UploadFile]] = File(None, description="One or more product images"),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new product and upload its images.
    """
    category_oid = validate_objectid(category_id)
    # Resolve the actual vendor ObjectId to associate with the product
    # Priority:
    # 1) Use provided vendor_id if it corresponds to an existing vendor
    # 2) Otherwise, use the vendor whose user_id equals the current user.user_id
    vendor_oid = None
    if vendor_id:
        vid = validate_objectid(vendor_id)
        vdoc = cate_db.vendors.find_one({"_id": vid})
        if not vdoc:
            raise HTTPException(status_code=404, detail="Vendor not found")
        vendor_oid = vdoc["_id"]
    else:
        # current_user comes from the users DB and contains a stable string user_id
        user_vendor = cate_db.vendors.find_one({"user_id": str(current_user.get("user_id", ""))})
        if not user_vendor:
            raise HTTPException(status_code=400, detail="No vendor profile associated with current user")
        vendor_oid = user_vendor["_id"]

    if not cate_db.categories.find_one({"_id": category_oid}):
        raise HTTPException(status_code=404, detail="Category not found")
    # Accept current user's id as vendor without enforcing presence in vendors collection
    # If you need strict validation, ensure your auth user ids are stored in vendors

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

    result = product_collection.insert_one(product_dict)
    new_product = product_collection.find_one({"_id": result.inserted_id})
    return objectid_str(new_product)


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
    """
    vid = validate_objectid(vendor_id)
    products_cursor = product_collection.find({"vendor_id": vid})
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
                vendor_data = {
                    "id": str(vdoc.get("_id")),
                    "user_id": vdoc.get("user_id"),
                    "shop_name": vdoc.get("shop_name"),
                    "address": vdoc.get("address"),
                    "image": vdoc.get("image"),
                }
        except Exception:
            pass

    return {
        "id": str(product["_id"]),
        "name": product.get("product_name") or product.get("name") or "Untitled Product",
        "description": product.get("description", "No description available"),
        "price": product.get("price"),
        "stock": product.get("stock"),
        "condition": product.get("product_condition") or product.get("condition") or "N/A",
        "images": product.get("images", []),  # ✅ return list of all image paths
        "category_id": category_id,
        "vendor_id": vendor_id,  # ✅ stringified vendor_id always returned
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
    current_user: dict = Depends(get_current_user)
):
    """
    Update product details or add new images.
    """
    product_oid = validate_objectid(product_id)
    product = product_collection.find_one({"_id": product_oid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_fields = {"updated_at": datetime.utcnow()}
    if category_id: update_fields["category_id"] = validate_objectid(category_id)
    if product_name: update_fields["product_name"] = product_name
    if description: update_fields["description"] = description
    if price is not None: update_fields["price"] = price
    if stock is not None: update_fields["stock"] = stock
    if product_condition: update_fields["product_condition"] = product_condition.value
    if brand is not None: update_fields["brand"] = brand
    if vendor_id: update_fields["vendor_id"] = validate_objectid(vendor_id)
    if files:
        update_fields["images"] = product.get("images", []) + save_images(files)

    product_collection.update_one({"_id": product_oid}, {"$set": update_fields})
    updated_product = product_collection.find_one({"_id": product_oid})
    return objectid_str(updated_product)


# ---------- DELETE PRODUCT ----------
@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a product by its ID.
    """
    product_oid = validate_objectid(product_id)
    result = product_collection.delete_one({"_id": product_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}















































