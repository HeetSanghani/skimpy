# backend/app/api/v1/routes/variants.py
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import os, uuid, json
from ....db.mongodb import cate_db
from app.core.security import get_current_user
from app.services.image_upload import upload_image_to_imgbb


router = APIRouter(prefix="/Variant", tags=["Variants"])

# Collections
product_collection = cate_db.products
variant_collection = cate_db.variants
attribute_collection = cate_db.attributes
value_collection = cate_db.attribute_values

# No local upload directory needed when using ImgBB


def save_images(files: Optional[List[UploadFile]]):
    image_urls: List[str] = []
    if not files:
        return image_urls
    for file in files:
        file_bytes = file.file.read()
        if not file_bytes:
            continue
        url, _ = upload_image_to_imgbb(file_bytes)
        image_urls.append(url)
    return image_urls


# ---------- CREATE VARIANT ----------
@router.post(
    "/add/{product_id}",
    summary="Add Variant to Product",
)
async def add_variant(
    product_id: str,
    sku: Optional[str] = Form(
        None, description="SKU for this variant (auto-generated if missing)", example="abc123"
    ),
    price: float = Form(..., description="Price for this variant", example=499.99),
    stock: int = Form(..., description="Stock quantity", example=50),
    attribute_values: str = Form(
        ..., 
        description='JSON list of attribute-value pairs, e.g., [{"attribute_id": "id", "value_id": "id"}]',
        example='[{"attribute_id": "670e8b3f111111111", "value_id": "670e8b3f222222222"}]'
    ),
    description: Optional[str] = Form(None, description="Description for this variant"),
    product_condition: Optional[str] = Form(None, description="Condition: NEW, USED, REFURBISHED"),
    brand: Optional[str] = Form(None, description="Brand name"),
    images: Optional[List[UploadFile]] = File(None, description="Optional images for this variant"),
    current_user: dict = Depends(get_current_user)
):
    """ 
    
Create a variant for an existing product.     

You can attach color, fabric, size, or other attributes.   

Each variant can have its own SKU, price, stock, and images.    

<pre>{"attribute_id": "id", "value_id": "id"}</pre>
<pre>Ex:- [{"attribute_id":"690451adc16f50c706ad6cef","value_id":"690451d8c16f50c706ad6cf0"}]</pre>

⚙️ ATTRIBUTE + VALUE IDS (for testing / seller UI reference)

Color
------
- Red:    68ef3eea6a23db730ef71fc3
- Green:  68ef3f036a23db730ef71fc4

Fabric
------
- Cotton: 68ef3f1e6a23db730ef71fc5
- Silk:   68ef3f286a23db730ef71fc6

Size
------
- 34: 68ef3f456a23db730ef71fc7
- 32: 68ef3f536a23db730ef71fc8
    
    """
    product = product_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not sku:
        sku = str(uuid.uuid4()).split("-")[0]

    if variant_collection.find_one({"sku": sku}):
        raise HTTPException(status_code=400, detail="SKU already exists")

    try:
        attrs = json.loads(attribute_values)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON for attribute_values")

    for a in attrs:
        if not value_collection.find_one({"_id": ObjectId(a["value_id"])}):
            raise HTTPException(status_code=400, detail=f"Invalid value_id: {a['value_id']}")

    img_urls = save_images(images)
    variant_doc = {
        "product_id": ObjectId(product_id),
        "sku": sku,
        "price": price,
        "stock": stock,
        "attributes": attrs,
        "images": img_urls,
        "description": description,
        "product_condition": product_condition,
        "brand": brand,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = variant_collection.insert_one(variant_doc)
    return {"message": "Variant added", "variant_id": str(result.inserted_id)}


# ---------- GET VARIANTS BY PRODUCT ----------
@router.get(
    "/list/{product_id}",
    summary="Get all Variants of a Product",
    description="Retrieve all variants for a product along with their attribute names and values."
)
def get_variants(product_id: str):
    variants = variant_collection.find({"product_id": ObjectId(product_id)})
    result = []
    for v in variants:
        details = []
        for a in v.get("attributes", []):
            attr = attribute_collection.find_one({"_id": ObjectId(a["attribute_id"])})
            val = value_collection.find_one({"_id": ObjectId(a["value_id"])})
            if attr and val:
                details.append({
                    "attribute_name": attr["name"],
                    "value_name": val["value"]
                })
        result.append({
            "id": str(v["_id"]),
            "sku": v["sku"],
            "price": v["price"],
            "stock": v["stock"],
            "images": v.get("images", []),
            "attributes": details
        })
    return {"variants": result}


# ---------- UPDATE VARIANT ----------
@router.put(
    "/update/{variant_id}",
    summary="Update Variant",
    description="""
    Update a variant's SKU, price, stock, attributes, or images. 
    You can append new images without removing old ones.
    """
)
async def update_variant(
    variant_id: str,
    sku: Optional[str] = Form(None, description="New SKU for this variant"),
    price: Optional[float] = Form(None, description="New price"),
    stock: Optional[int] = Form(None, description="New stock quantity"),
    attribute_values: Optional[str] = Form(
        None, 
        description='JSON list of attribute-value pairs to update, e.g., [{"attribute_id": "id", "value_id": "id"}]'
    ),
    description: Optional[str] = Form(None, description="Updated description"),
    product_condition: Optional[str] = Form(None, description="Updated condition: NEW, USED, REFURBISHED"),
    brand: Optional[str] = Form(None, description="Updated brand name"),
    images: Optional[List[UploadFile]] = File(None, description="New images to add"),
    current_user: dict = Depends(get_current_user)
    
):
    variant = variant_collection.find_one({"_id": ObjectId(variant_id)})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    update_data = {}

    if sku:
        exists = variant_collection.find_one({"sku": sku, "_id": {"$ne": ObjectId(variant_id)}})
        if exists:
            raise HTTPException(status_code=400, detail="SKU already exists")
        update_data["sku"] = sku

    if price is not None:
        update_data["price"] = price
    if stock is not None:
        update_data["stock"] = stock
    if description is not None:
        update_data["description"] = description
    if product_condition is not None:
        update_data["product_condition"] = product_condition
    if brand is not None:
        update_data["brand"] = brand

    if attribute_values:
        try:
            update_data["attributes"] = json.loads(attribute_values)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON for attribute_values")

    if images:
        new_imgs = save_images(images)
        update_data["images"] = variant.get("images", []) + new_imgs

    update_data["updated_at"] = datetime.utcnow()
    variant_collection.update_one({"_id": ObjectId(variant_id)}, {"$set": update_data})
    return {"message": "Variant updated successfully"}


# ---------- DELETE VARIANT ----------
@router.delete(
    "/delete/{variant_id}",
    summary="Delete Variant",
    description="Remove a variant from the database."
    
)
def delete_variant(variant_id: str,current_user: dict = Depends(get_current_user)):
    variant = variant_collection.find_one({"_id": ObjectId(variant_id)}),
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    variant_collection.delete_one({"_id": ObjectId(variant_id)})
    return {"message": "Variant deleted successfully"}



























# # backend/app/api/v1/routes/variants.py

# from fastapi import APIRouter, Form, File, UploadFile, HTTPException
# from bson import ObjectId
# from datetime import datetime
# from typing import List, Optional
# import os, uuid, json
# from ....db.mongodb import cate_db

# router = APIRouter()

# # Collections
# product_collection = cate_db.products
# variant_collection = cate_db.variants
# attribute_collection = cate_db.attributes
# value_collection = cate_db.attribute_values

# # Upload Directory
# UPLOAD_DIR = "static/uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)


# # ---------- Helper: Save Multiple Images ----------
# def save_images(files: Optional[List[UploadFile]]):
#     image_urls = []
#     if not files:
#         return image_urls
#     for file in files:
#         ext = file.filename.split(".")[-1]
#         filename = f"{uuid.uuid4()}.{ext}"
#         file_path = os.path.join(UPLOAD_DIR, filename)
#         with open(file_path, "wb") as f:
#             f.write(file.file.read())
#         image_urls.append(f"/{file_path}")
#     return image_urls


# # ---------- CREATE VARIANT ----------
# @router.post("/add_variant/{product_id}")
# async def add_variant(
#     product_id: str,
#     sku: Optional[str] = Form(None),
#     price: float = Form(...),
#     stock: int = Form(...),
#     attribute_values: str = Form(...),  # JSON like: [{"attribute_id":"..","value_id":".."}, ...]
#     images: Optional[List[UploadFile]] = File(None)
# ):
#     """
#     Create a new variant for a product.
#     Example attribute_values:
#     [
#       {"attribute_id": "6718a1f9e7...", "value_id": "6718a2f1a4..."},
#       {"attribute_id": "6718a203a3...", "value_id": "6718a213a5..."}
#     ]
#     """
#     # Check product existence
#     product = product_collection.find_one({"_id": ObjectId(product_id)})
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")

#     # SKU auto-generate if missing
#     if not sku:
#         sku = str(uuid.uuid4()).split("-")[0]

#     # Prevent duplicate SKU
#     if variant_collection.find_one({"sku": sku}):
#         raise HTTPException(status_code=400, detail="SKU already exists")

#     # Parse attributes JSON
#     try:
#         attrs = json.loads(attribute_values)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid JSON format for attribute_values")

#     # Validate all value_ids exist
#     for pair in attrs:
#         val = value_collection.find_one({"_id": ObjectId(pair["value_id"])})
#         if not val:
#             raise HTTPException(status_code=400, detail=f"Invalid value_id: {pair['value_id']}")

#     # Save uploaded images
#     img_urls = save_images(images)

#     # Build and insert document
#     data = {
#         "product_id": ObjectId(product_id),
#         "sku": sku,
#         "price": price,
#         "stock": stock,
#         "attributes": attrs,  # list of {attribute_id, value_id}
#         "images": img_urls,
#         "created_at": datetime.utcnow(),
#         "updated_at": datetime.utcnow(),
#     }
#     result = variant_collection.insert_one(data)
#     return {"message": "Variant created successfully", "variant_id": str(result.inserted_id)}


# # ---------- READ VARIANTS FOR A PRODUCT ----------
# @router.get("/get_variants/{product_id}")
# def get_variants(product_id: str):
#     """
#     List all variants for a product with attribute names and values expanded.
#     """
#     variants = variant_collection.find({"product_id": ObjectId(product_id)})
#     result = []

#     for v in variants:
#         detailed_attrs = []
#         for a in v.get("attributes", []):
#             attr = attribute_collection.find_one({"_id": ObjectId(a["attribute_id"])})
#             val = value_collection.find_one({"_id": ObjectId(a["value_id"])})
#             if attr and val:
#                 detailed_attrs.append({
#                     "attribute_id": str(attr["_id"]),
#                     "attribute_name": attr["name"],
#                     "value_id": str(val["_id"]),
#                     "value_name": val["value"]
#                 })

#         result.append({
#             "id": str(v["_id"]),
#             "sku": v.get("sku"),
#             "price": v.get("price"),
#             "stock": v.get("stock"),
#             "images": v.get("images", []),
#             "attributes": detailed_attrs,
#             "created_at": v.get("created_at"),
#         })

#     return {"variants": result}


# # ---------- UPDATE VARIANT ----------
# @router.put("/update_variant/{variant_id}")
# async def update_variant(
#     variant_id: str,
#     sku: Optional[str] = Form(None),
#     price: Optional[float] = Form(None),
#     stock: Optional[int] = Form(None),
#     attribute_values: Optional[str] = Form(None),  # JSON list of {attribute_id, value_id}
#     images: Optional[List[UploadFile]] = File(None)
# ):
#     variant = variant_collection.find_one({"_id": ObjectId(variant_id)})
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")

#     update_data = {}

#     # SKU check
#     if sku:
#         exists = variant_collection.find_one({"sku": sku, "_id": {"$ne": ObjectId(variant_id)}})
#         if exists:
#             raise HTTPException(status_code=400, detail="SKU already exists")
#         update_data["sku"] = sku

#     if price is not None:
#         update_data["price"] = price
#     if stock is not None:
#         update_data["stock"] = stock

#     # Handle attributes
#     if attribute_values:
#         try:
#             attrs = json.loads(attribute_values)
#         except Exception:
#             raise HTTPException(status_code=400, detail="Invalid JSON format for attribute_values")
#         update_data["attributes"] = attrs

#     # Add new images (keep old)
#     if images:
#         new_imgs = save_images(images)
#         old_imgs = variant.get("images", [])
#         update_data["images"] = old_imgs + new_imgs

#     update_data["updated_at"] = datetime.utcnow()

#     variant_collection.update_one({"_id": ObjectId(variant_id)}, {"$set": update_data})
#     return {"message": "Variant updated successfully"}


# # ---------- DELETE VARIANT ----------
# @router.delete("/delete_variant/{variant_id}")
# def delete_variant(variant_id: str):
#     variant = variant_collection.find_one({"_id": ObjectId(variant_id)})
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")

#     variant_collection.delete_one({"_id": ObjectId(variant_id)})
#     return {"message": "Variant deleted successfully"}
