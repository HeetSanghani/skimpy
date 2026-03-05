# backend/app/api/v1/routes/variants.py
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import os, uuid, json
from ....db.mongodb import cate_db
from app.security.dependencies import get_current_user
from app.services.image_upload import upload_image_to_imgbb


router = APIRouter(prefix="/Variant", tags=["Variants"])

# Collections
product_collection = cate_db.products
variant_collection = cate_db.variants
attribute_collection = cate_db.attributes
value_collection = cate_db.attribute_values


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
    description="""
Create a variant for an existing product.

Each product always has at least **one variant** (the main/default variant).
Additional variants can be added for different sizes, colors, etc.

`attribute_values` is a JSON list of attribute-value ID pairs:
```json
[{"attribute_id": "<id>", "value_id": "<id>"}]
```
Pass an empty list `[]` if no attributes apply.
"""
)
async def add_variant(
    product_id: str,
    sku: Optional[str] = Form(
        None, description="SKU for this variant (auto-generated if missing)"
    ),
    price: float = Form(..., description="Price for this variant", example=499.99),
    stock: int = Form(..., description="Stock quantity", example=50),
    attribute_values: Optional[str] = Form(
        None,
        description='JSON list of attribute-value pairs, e.g., [{"attribute_id": "id", "value_id": "id"}]',
    ),
    description: Optional[str] = Form(None, description="Description for this variant"),
    product_condition: Optional[str] = Form(None, description="Condition: NEW, USED, REFURBISHED"),
    brand: Optional[str] = Form(None, description="Brand name"),
    images: Optional[List[UploadFile]] = File(None, description="Optional images for this variant"),
    current_user: dict = Depends(get_current_user)
):
    product = product_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # If seller provided a SKU, honour it — reject if duplicate
    if sku:
        if variant_collection.find_one({"sku": sku}):
            raise HTTPException(
                status_code=400,
                detail=f"SKU '{sku}' already exists. Please use a unique SKU."
            )
    else:
        # Auto-generate only when seller left SKU empty
        sku = str(uuid.uuid4()).replace("-", "")[:10]
        while variant_collection.find_one({"sku": sku}):
            sku = str(uuid.uuid4()).replace("-", "")[:10]

    # Parse attribute_values JSON (gracefully, never crash)
    attrs = []
    if attribute_values:
        try:
            parsed = json.loads(attribute_values)
            if isinstance(parsed, list):
                attrs = parsed
        except Exception:
            attrs = []  # Invalid JSON — just skip, don't reject

    # Validate + filter attribute pairs (skip invalid value_ids, don't hard-fail)
    valid_attrs = []
    for a in attrs:
        attr_id = a.get("attribute_id", "")
        val_id = a.get("value_id", "")
        if not attr_id or not val_id:
            continue
        try:
            # Check that the value exists; skip silently if not
            if value_collection.find_one({"_id": ObjectId(val_id)}):
                valid_attrs.append({"attribute_id": attr_id, "value_id": val_id})
        except Exception:
            continue  # Bad ObjectId format — skip

    img_urls = save_images(images)

    variant_doc = {
        "product_id": ObjectId(product_id),
        "sku": sku,
        "price": price,
        "stock": stock,
        "attributes": valid_attrs,
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
    """
    Return all variants for a product.
    Supports both legacy documents where product_id is stored as a string,
    and newer ones where product_id is an ObjectId.
    """
    query = {"$or": [{"product_id": ObjectId(product_id)}]}
    # Also match string form for backward compatibility
    query["$or"].append({"product_id": product_id})
    variants = variant_collection.find(query)
    result = []
    for v in variants:
        details = []
        for a in v.get("attributes", []):
            try:
                attr = attribute_collection.find_one({"_id": ObjectId(a["attribute_id"])})
                val = value_collection.find_one({"_id": ObjectId(a["value_id"])})
                if attr and val:
                    details.append({
                        "attribute_name": attr["name"],
                        "value_name": val["value"]
                    })
            except Exception:
                continue
        result.append({
            "id": str(v["_id"]),
            "sku": v["sku"],
            "price": v["price"],
            "stock": v["stock"],
            "images": v.get("images", []),
            "attributes": details,
            "description": v.get("description"),
            "product_condition": v.get("product_condition"),
            "brand": v.get("brand"),
            "created_at": str(v["created_at"]) if v.get("created_at") else None,
            "updated_at": str(v["updated_at"]) if v.get("updated_at") else None,
        })
    return {"variants": result}


# ---------- UPDATE VARIANT ----------
@router.put(
    "/update/{variant_id}",
    summary="Update Variant",
    description="Update a variant's SKU, price, stock, attributes, or images."
)
async def update_variant(
    variant_id: str,
    sku: Optional[str] = Form(None, description="New SKU for this variant"),
    price: Optional[float] = Form(None, description="New price"),
    stock: Optional[int] = Form(None, description="New stock quantity"),
    attribute_values: Optional[str] = Form(None, description='JSON list of attribute-value pairs to update'),
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
            parsed = json.loads(attribute_values)
            if isinstance(parsed, list):
                update_data["attributes"] = parsed
        except Exception:
            pass  # Skip invalid JSON, don't crash

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
def delete_variant(variant_id: str, current_user: dict = Depends(get_current_user)):
    variant = variant_collection.find_one({"_id": ObjectId(variant_id)})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    variant_collection.delete_one({"_id": ObjectId(variant_id)})
    return {"message": "Variant deleted successfully"}
