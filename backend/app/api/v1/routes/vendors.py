from fastapi import APIRouter, HTTPException,File, UploadFile, Form, Depends
from bson import ObjectId
from typing import List, Optional, Union
from datetime import datetime
from ....db.mongodb import cate_db
from ....schemas.vendor import VendorResponse
import os, shutil
from app.core.security import get_current_user
from app.services.image_upload import upload_image_to_imgbb

router = APIRouter(prefix="/Vendor", tags=["Vendors"])



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



#------------- add ------------------------------
@router.post("", response_model=VendorResponse)
def create_vendor(  user_id: Optional[str] = Form(""),
    shop_name: str = Form(""),
    address: str = Form(""),
    parent_id: Optional[str] = Form("", description=" ID or Leave empty id"),
    file: Union[UploadFile, None, str] = File(None),
    current_user: dict = Depends(get_current_user)
):
    vendor_dict = {
        "user_id": user_id if user_id else None,
        "shop_name": shop_name,
        "address": address,
        "parent_id": parent_id if parent_id else None,
        "created_at": datetime.now(),
        "updated_at": None,
        "image": None
    }

    if file:
        file_bytes = file.file.read()
        if file_bytes:
            image_url, _ = upload_image_to_imgbb(file_bytes)
            vendor_dict["image"] = image_url  
    
    # vendor_dict = vendor.dict()

    vendor_dict["updated_at"] = None
    result = cate_db.vendors.insert_one(vendor_dict)
    new_vendor = cate_db.vendors.find_one({"_id": result.inserted_id})

    return objectid_str(new_vendor)

#--------------- get ---------------------------------------------
from typing import Optional, List

@router.get("/", response_model=List[VendorResponse])
def list_vendors(has_parent: Optional[bool] = None):
    vendor_list = []

    if has_parent is True:
        query = {"parent_id": {"$nin": [None, ""]}}  # vendors with parent_id
    elif has_parent is False:
        query = {"$or": [{"parent_id": None}, {"parent_id": ""}]}  # vendors without parent_id
    else:
        query = {}  # all vendors

    for vendor in cate_db.vendors.find(query):
        vendor_list.append(objectid_str(vendor))

    return vendor_list



@router.get("", response_model=VendorResponse)
def get_vendor(vendor_id: str):
    try:
        vendor_obj_id = ObjectId(vendor_id)  
    except:
        raise HTTPException(status_code=400, detail="Invalid vendor ID format")

    vendor = cate_db.vendors.find_one({"_id": vendor_obj_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return objectid_str(vendor) 


# ------------------- Update -------------------
@router.put("", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    user_id: Optional[str] = Form(""),
    shop_name: str = Form(""),
    address: Optional[str] = Form(""),
    parent_id: Optional[str] = Form("", description="ID or Leave empty id"),
    file: Union[UploadFile, None, str] = File(None),
    current_user: dict = Depends(get_current_user) 
):
    try:
        vendor_oid = ObjectId(vendor_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid vendor id")

    existing = cate_db.vendors.find_one({"_id": vendor_oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Keep old image unless replaced
    image_path = existing.get("image")

    if file and hasattr(file, "filename") and file.filename:
        file_bytes = file.file.read()
        if file_bytes:
            image_url, _ = upload_image_to_imgbb(file_bytes)
            image_path = image_url

    update_fields = {"updated_at": datetime.now()}

    if user_id and user_id.strip():
        update_fields["user_id"] = user_id.strip()
    if shop_name and shop_name.strip():
        update_fields["shop_name"] = shop_name.strip()
    if address and address.strip():
        update_fields["address"] = address.strip()
    if parent_id and parent_id.strip():
        update_fields["parent_id"] = parent_id.strip()

    # Always set image (old or new)
    update_fields["image"] = image_path

    result = cate_db.vendors.update_one({"_id": vendor_oid}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")

    updated = cate_db.vendors.find_one({"_id": vendor_oid})
    return objectid_str(updated)



# ------------------- Delete -------------------
@router.delete("", response_model=dict)
def delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    try:
        vendor_id = ObjectId(vendor_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid vendor id")

    result = cate_db.vendors.delete_one({"_id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="vendor not found")

    return {"message": "vendor deleted successfully"}
