from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from bson import ObjectId
from typing import List, Optional, Union
from datetime import datetime
import os, shutil, uuid
from ....db.mongodb import cate_db
from ....schemas.product import ProductResponse, ProductCondition
from app.core.security import get_current_user

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


def save_images(files: Union[List[UploadFile], UploadFile, None], folder="uploads/products") -> List[str]:
    """Save uploaded images to disk and return their file paths."""
    os.makedirs(folder, exist_ok=True)
    saved_files = []
    if not files:
        return saved_files
    if isinstance(files, UploadFile):
        files = [files]
    for file in files:
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(folder, filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        saved_files.append(file_path.replace("\\", "/"))
    return saved_files


# ---------- CREATE PRODUCT ----------
@router.post("", response_model=ProductResponse)
async def create_product(
    category_id: str = Form(..., description="Category ID where the product belongs", example="670e8b3f111111111"),
    product_name: str = Form(..., description="Name of the product", example="Men's Blue T-Shirt"),
    description: Optional[str] = Form("", description="Detailed description of the product", example="Comfortable cotton T-shirt for daily wear"),
    price: float = Form(..., description="Base price of the product", example=499.99),
    stock: int = Form(..., description="Available stock quantity", example=100),
    product_condition: ProductCondition = Form(ProductCondition.NEW, description="Condition of the product (new/used/refurbished)"),
    vendor_id: Optional[str] = Form(None, description="Vendor ID (if product belongs to a specific vendor)", example="670e8b3f111111112"),
    files: Optional[List[UploadFile]] = File(None, description="One or more product images"),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new product and upload its images.
    """
    category_oid = validate_objectid(category_id)
    vendor_oid = validate_objectid(vendor_id) if vendor_id else None

    if not cate_db.categories.find_one({"_id": category_oid}):
        raise HTTPException(status_code=404, detail="Category not found")
    if vendor_oid and not cate_db.vendors.find_one({"_id": vendor_oid}):
        raise HTTPException(status_code=404, detail="Vendor not found")

    product_dict = {
        "product_name": product_name,
        "description": description,
        "price": price,
        "stock": stock,
        "product_condition": product_condition.value,
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


# ---------- GET SINGLE PRODUCT ----------
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str):
    """
    Get a single product by its ID.
    """
    product = product_collection.find_one({"_id": validate_objectid(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return objectid_str(product)


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



















































# # backend/app/api/v1/routes/products.py
# from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
# from bson import ObjectId
# from typing import List, Optional, Union
# from datetime import datetime
# import os, shutil, uuid
# from ....db.mongodb import cate_db
# from ....schemas.product import ProductResponse, ProductCondition
# from app.core.security import get_current_user

# router = APIRouter(prefix="/Product", tags=["Products"])

# # Collections
# product_collection = cate_db.products


# # ---------- Helpers ----------
# def objectid_str(doc):
#     """Convert ObjectId fields to strings for JSON response."""
#     doc["_id"] = str(doc["_id"])
#     if "category_id" in doc:
#         doc["category_id"] = str(doc["category_id"])
#     if "vendor_id" in doc and doc["vendor_id"] is not None:
#         doc["vendor_id"] = str(doc["vendor_id"])
#     return doc


# def validate_objectid(id_str: str) -> ObjectId:
#     if not ObjectId.is_valid(id_str):
#         raise HTTPException(status_code=400, detail="Invalid ObjectId")
#     return ObjectId(id_str)


# def save_images(files: Union[List[UploadFile], UploadFile, None], folder="uploads/products") -> List[str]:
#     """Save images to folder and return their paths."""
#     os.makedirs(folder, exist_ok=True)
#     saved_files = []
#     if not files:
#         return saved_files
#     if isinstance(files, UploadFile):
#         files = [files]
#     for file in files:
#         ext = file.filename.split(".")[-1]
#         filename = f"{uuid.uuid4()}.{ext}"
#         file_path = os.path.join(folder, filename)
#         with open(file_path, "wb") as f:
#             shutil.copyfileobj(file.file, f)
#         saved_files.append(file_path.replace("\\", "/"))
#     return saved_files


# # ---------- CREATE PRODUCT ----------
# @router.post("", response_model=ProductResponse)
# async def create_product(
#     category_id: str = Form(...),
#     product_name: str = Form(...),
#     description: Optional[str] = Form(""),
#     price: float = Form(...),
#     stock: int = Form(...),
#     product_condition: ProductCondition = Form(ProductCondition.NEW),
#     vendor_id: Optional[str] = Form(None),
#     files: Optional[List[UploadFile]] = File(None),
#     current_user: dict = Depends(get_current_user)
# ):
#     category_oid = validate_objectid(category_id)
#     vendor_oid = validate_objectid(vendor_id) if vendor_id else None

#     if not cate_db.categories.find_one({"_id": category_oid}):
#         raise HTTPException(status_code=404, detail="Category not found")
#     if vendor_oid and not cate_db.vendors.find_one({"_id": vendor_oid}):
#         raise HTTPException(status_code=404, detail="Vendor not found")

#     product_dict = {
#         "product_name": product_name,
#         "description": description,
#         "price": price,
#         "stock": stock,
#         "product_condition": product_condition.value,
#         "category_id": category_oid,
#         "vendor_id": vendor_oid,
#         "images": save_images(files),
#         "created_at": datetime.utcnow(),
#         "updated_at": None
#     }

#     result = product_collection.insert_one(product_dict)
#     new_product = product_collection.find_one({"_id": result.inserted_id})
#     return objectid_str(new_product)


# # ---------- GET ALL PRODUCTS ----------
# @router.get("/", response_model=List[ProductResponse])
# def list_product(vendor: Optional[bool] = None):
#     query = {}
#     if vendor is True:
#         query = {"vendor_id": {"$nin": [None, ""]}}
#     elif vendor is False:
#         query = {"$or": [{"vendor_id": None}, {"vendor_id": ""}]}
#     products = [objectid_str(p) for p in product_collection.find(query)]
#     return products


# # ---------- GET SINGLE PRODUCT ----------
# @router.get("/{product_id}", response_model=ProductResponse)
# def get_product(product_id: str):
#     product = product_collection.find_one({"_id": validate_objectid(product_id)})
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
#     return objectid_str(product)


# # ---------- UPDATE PRODUCT ----------
# @router.put("/{product_id}", response_model=ProductResponse)
# def update_product(
#     product_id: str,
#     category_id: Optional[str] = Form(None),
#     product_name: Optional[str] = Form(None),
#     description: Optional[str] = Form(None),
#     price: Optional[float] = Form(None),
#     stock: Optional[int] = Form(None),
#     product_condition: Optional[ProductCondition] = Form(None),
#     vendor_id: Optional[str] = Form(None),
#     files: Optional[List[UploadFile]] = File(None),
#     current_user: dict = Depends(get_current_user)
# ):
#     product_oid = validate_objectid(product_id)
#     product = product_collection.find_one({"_id": product_oid})
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")

#     update_fields = {"updated_at": datetime.utcnow()}
#     if category_id: update_fields["category_id"] = validate_objectid(category_id)
#     if product_name: update_fields["product_name"] = product_name
#     if description: update_fields["description"] = description
#     if price is not None: update_fields["price"] = price
#     if stock is not None: update_fields["stock"] = stock
#     if product_condition: update_fields["product_condition"] = product_condition.value
#     if vendor_id: update_fields["vendor_id"] = validate_objectid(vendor_id)
#     if files:
#         update_fields["images"] = product.get("images", []) + save_images(files)

#     product_collection.update_one({"_id": product_oid}, {"$set": update_fields})
#     updated_product = product_collection.find_one({"_id": product_oid})
#     return objectid_str(updated_product)


# # ---------- DELETE PRODUCT ----------
# @router.delete("/{product_id}")
# def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
#     product_oid = validate_objectid(product_id)
#     result = product_collection.delete_one({"_id": product_oid})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Product not found")
#     return {"message": "Product deleted successfully"}



