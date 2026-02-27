"""
Public router - /api/public/*
Open APIs for marketplace browsing. No authentication required.
"""
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import List, Optional

from app.db.mongodb import cate_db, contact_messages_collection
from app.schemas.category import CategoryResponse
from app.schemas.product import ProductResponse
from app.schemas.vendor import VendorResponse

router = APIRouter(prefix="/api/public", tags=["Public"])

product_collection = cate_db.products
variant_collection = cate_db.variants


def objectid_str(doc):
    if not doc:
        return doc
    doc = doc.copy() if isinstance(doc, dict) else doc
    doc["_id"] = str(doc["_id"])
    if "category_id" in doc and doc.get("category_id"):
        doc["category_id"] = str(doc["category_id"])
    if "vendor_id" in doc and doc.get("vendor_id"):
        doc["vendor_id"] = str(doc["vendor_id"])
    if "parent_id" in doc and doc.get("parent_id"):
        doc["parent_id"] = str(doc["parent_id"])
    return doc


def validate_objectid(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ObjectId")
    return ObjectId(id_str)


# ---------- Categories ----------
@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(parent_only: Optional[bool] = None):
    query = {}
    if parent_only is True:
        query = {"parent_id": {"$nin": [None, ""]}}
    elif parent_only is False:
        query = {"$or": [{"parent_id": None}, {"parent_id": ""}]}
    return [objectid_str(c) for c in cate_db.categories.find(query)]


@router.get("/categories/{category_id}", response_model=List[CategoryResponse])
def get_category_with_children(category_id: str):
    oid = validate_objectid(category_id)
    parent = cate_db.categories.find_one({"_id": oid})
    if not parent:
        raise HTTPException(status_code=404, detail="Category not found")
    children = list(cate_db.categories.find({"parent_id": str(oid)}))
    return [objectid_str(parent)] + [objectid_str(c) for c in children]


# ---------- Products ----------
@router.get("/products", response_model=List[ProductResponse])
def list_products(vendor: Optional[bool] = None):
    query = {}
    if vendor is True:
        query = {"vendor_id": {"$nin": [None, ""]}}
    elif vendor is False:
        query = {"$or": [{"vendor_id": None}, {"vendor_id": ""}]}
    return [objectid_str(p) for p in product_collection.find(query)]


@router.get("/products/by-vendor/{vendor_id}", response_model=List[ProductResponse])
def list_products_by_vendor(vendor_id: str):
    v_doc = cate_db.vendors.find_one({"_id": ObjectId(vendor_id)}) if ObjectId.is_valid(vendor_id) else None
    if not v_doc:
        v_doc = cate_db.vendors.find_one({"user_id": vendor_id})
    if not v_doc:
        return []
    return [objectid_str(p) for p in product_collection.find({"vendor_id": v_doc["_id"]})]


@router.get("/products/by-category")
def list_products_by_category(slug: str):
    category = cate_db.categories.find_one({"slug": slug})
    if not category:
        return []
    def get_children(ids):
        c = list(cate_db.categories.find({"parent_id": {"$in": [str(i) for i in ids]}}))
        return c + get_children([x["_id"] for x in c]) if c else []
    ids = [category["_id"]] + [x["_id"] for x in get_children([category["_id"]])]
    return [objectid_str(p) for p in product_collection.find({"category_id": {"$in": ids}})]


@router.get("/products/{product_id}")
def get_product(product_id: str):
    product = product_collection.find_one({"_id": validate_objectid(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    vendor_id = str(product["vendor_id"]) if product.get("vendor_id") else None
    category_id = str(product["category_id"]) if product.get("category_id") else None
    vendor_data = None
    if vendor_id:
        vdoc = cate_db.vendors.find_one({"_id": ObjectId(vendor_id)})
        if vdoc:
            vendor_data = {"id": str(vdoc["_id"]), "user_id": vdoc.get("user_id"), "shop_name": vdoc.get("shop_name"), "image": vdoc.get("image")}
    return {
        "id": str(product["_id"]), "_id": str(product["_id"]),
        "product_name": product.get("product_name") or "Untitled",
        "name": product.get("product_name") or "Untitled",
        "description": product.get("description", ""),
        "price": product.get("price"),
        "stock": product.get("stock"),
        "images": product.get("images", []),
        "category_id": category_id, "vendor_id": vendor_id, "vendor": vendor_data,
    }


# ---------- Vendors ----------
@router.get("/vendors", response_model=List[VendorResponse])
def list_vendors(has_parent: Optional[bool] = None):
    query = {} if has_parent is None else ({"parent_id": {"$nin": [None, ""]}} if has_parent else {"$or": [{"parent_id": None}, {"parent_id": ""}]})
    return [objectid_str(v) for v in cate_db.vendors.find(query)]


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str):
    v = cate_db.vendors.find_one({"_id": ObjectId(vendor_id)}) if ObjectId.is_valid(vendor_id) else cate_db.vendors.find_one({"user_id": vendor_id})
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return objectid_str(v)


# ---------- Contact (public - supports guest and logged-in) ----------
from pydantic import BaseModel, EmailStr
from datetime import datetime

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    category: str

@router.post("/contact")
async def send_contact(contact_data: ContactMessage):
    """Submit contact form. Works for guests."""
    new_message = contact_data.dict()
    new_message["created_at"] = datetime.utcnow()
    new_message["status"] = "unread"
    result = contact_messages_collection.insert_one(new_message)
    return {"message": "Message received successfully", "id": str(result.inserted_id)}
