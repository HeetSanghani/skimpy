from fastapi import APIRouter, HTTPException,File, UploadFile, Form, Depends
from bson import ObjectId
from typing import List, Optional, Union
from datetime import datetime
from ....db.mongodb import cate_db
from ....schemas.product import  ProductResponse, ProductCondition
import os, shutil
from app.core.security import get_current_user

router = APIRouter(prefix="/Product", tags=["Products"])

# ---------------- Helpers ----------------
def objectid_str(doc):
    doc["_id"] = str(doc["_id"])
    if "category_id" in doc:
        doc["category_id"] = str(doc["category_id"])
    return doc

def validate_objectid(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ObjectId")
    return ObjectId(id_str)



#----------------- add -----------------------------------------
@router.post("", response_model=ProductResponse)
def create_product(category_id: str,  
    product_name: str = Form(""),
    description: Optional[str] = Form(""),
    price: float = Form(""),
    stock: int = Form(""),
    product_condition: ProductCondition = Form(ProductCondition.NEW),
    vendor_id: str = Form(""),
    file: Union[UploadFile, None, str] = File(""),
    current_user: dict = Depends(get_current_user)  
): 
    # product_dict = product.dict()
    try:
        category_id = ObjectId(category_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    parent_categories = cate_db.categories.find_one({"_id": category_id})
    if not parent_categories:
        raise HTTPException(status_code=404, detail="cate not found")

     
    product_dict = {
        "product_name": product_name,
        "description": description,
        "price": price,
        "stock": stock,
        "product_condition": product_condition.value,  # store as string
        "category_id": category_id if category_id else None,
        "vendor_id": vendor_id if vendor_id else None,
        "created_at": datetime.now(),
        "updated_at": None,
        "image": None
    }


    if file:
        UPLOAD_DIR = "uploads/products"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        product_dict["image"] = file_path


    product_dict["updated_at"] = None
    product_dict["category_id"] = category_id

    result = cate_db.products.insert_one(product_dict)
    new_product = cate_db.products.find_one({"_id": result.inserted_id})
    return objectid_str(new_product)


#-------------- get ---------------------
@router.get("/", response_model=List[ProductResponse])
def list_product(vendor: Optional[bool] = None):
    product_list = []

    if vendor is True:
        query = {"vendor_id": {"$nin": [None, ""]}}
    elif vendor is False:
        query = {"$or": [{"vendor_id": None}, {"vendor_id": ""}]}
    else:
        query = {}

    for product in cate_db.products.find(query):
        product_list.append(objectid_str(product))

    return product_list



@router.get("", response_model=ProductResponse)
def get_product(product_id: str):
    id = validate_objectid(product_id)
    product = cate_db.products.find_one({"_id": id})
    if not product:
        raise HTTPException(status_code=404, detail="Category not found")
    return objectid_str(product)


# ------------------- Update -------------------
@router.put("", response_model=ProductResponse)
def update_product(
    category_id: str,
    product_id: str,
    product_name: str = Form(""),
    description: str = Form(""),
    price: float = Form(0.0),
    stock: int = Form(0),
    product_condition: ProductCondition = Form(ProductCondition.NEW),
    vendor_id: str = Form(""),
    file: Union[UploadFile, None, str] = File(None),
    current_user: dict = Depends(get_current_user)  
):
    try:
        category_oid = ObjectId(category_id)
        product_oid = ObjectId(product_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid id format")

    # Fetch existing product
    existing = cate_db.products.find_one({"_id": product_oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    update_fields = {"updated_at": datetime.now()}

    if product_name.strip():
        update_fields["product_name"] = product_name.strip()
    if description.strip():
        update_fields["description"] = description.strip()
    if product_condition.strip():
        update_fields["product_condition"] = product_condition.strip()
    if vendor_id.strip():
        update_fields["vendor_id"] = vendor_id.strip()
    if price > 0:
        update_fields["price"] = price
    if stock > 0:
        update_fields["stock"] = stock

    # Handle file upload
    if file and hasattr(file, "filename") and file.filename:
        UPLOAD_DIR = "uploads/products"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        update_fields["image"] = file_path.replace("\\", "/")
    else:
        # Keep old image if not replaced
        update_fields["image"] = existing.get("image", "")

    cate_db.products.update_one(
        {"_id": product_oid},
        {"$set": update_fields}
    )

    updated_product = cate_db.products.find_one({"_id": product_oid})
    return objectid_str(updated_product)


# ------------------- Delete -------------------

@router.delete("", response_model=dict)
def delete_product(category_id: str, product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        category_obj = ObjectId(category_id)
        product_obj = ObjectId(product_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Delete the product
    result = cate_db.products.delete_one({"_id": product_obj, "category_id": category_obj})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}
