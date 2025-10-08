from fastapi import APIRouter, HTTPException,File, UploadFile, Form, Query,Depends
from bson import ObjectId
from typing import List, Optional, Union
from datetime import datetime
from ....db.mongodb import cate_db
from ....schemas.category import CategoryResponse
from ....utils.slug import simple_slugify, generate_unique_slug, delete_category_and_children  
import os, shutil
from app.core.security import get_current_user 

router = APIRouter(prefix="/Category", tags=["Categories"])



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



# ====================== Category CRUD =========================

#------------- add ------------------------------
@router.post("", response_model=CategoryResponse)
def create_category(category_name: str = Form(""),
    parent_id: Optional[str] = Form("", description=" ID or Leave empty id"),
    file: Union[UploadFile, None, str] = File(None),
    current_user: dict = Depends(get_current_user)  
):
    name_clean = category_name.strip()

    if not name_clean:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")
    
    if cate_db.categories.find_one({"category_name": category_name.strip()}):
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Validate parent_id (foreign key simulation)
    if parent_id:
        if not ObjectId.is_valid(parent_id):
            raise HTTPException(status_code=400, detail="Invalid parent ID")
        parent = cate_db.categories.find_one({"_id": ObjectId(parent_id)})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    base_slug = simple_slugify(name_clean)
    slug = generate_unique_slug(base_slug, cate_db.categories, parent_id if parent_id else None)

    category_dict = {
        "category_name": category_name,
        "slug": slug,
        "parent_id": parent_id if parent_id else None,
        "created_at": datetime.now(),
        "updated_at": None,
        "image": None
    }
    if file:
        UPLOAD_DIR = "uploads/categories"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        category_dict["image"] = file_path

    # category_dict = category.dict() 


    result = cate_db.categories.insert_one(category_dict)
    new_category = cate_db.categories.find_one({"_id": result.inserted_id})

    return objectid_str(new_category)



# ------------------- Get -------------------

@router.get("", response_model=List[CategoryResponse])
def list_categories(parent_only: Optional[bool] = None):
    category_list = []

    if parent_only is True:
        # Only categories with a parent_id
        query = {"parent_id": {"$nin": [None, ""]}}
    elif parent_only is False:
        # Only categories without a parent_id (top-level)
        query = {"$or": [{"parent_id": None}, {"parent_id": ""}]}
    else:
        # All categories
        query = {}

    for category in cate_db.categories.find(query):
        category_list.append(objectid_str(category))

    return category_list



@router.get("/", response_model=List[CategoryResponse])
def get_category(category_id: Optional[str] = Query(None)):
    # if no category_id → return all top-level parents
    if not category_id:
        parents = list(cate_db.categories.find({
            "$or": [{"parent_id": None}, {"parent_id": ""}]
        }))
        return [objectid_str(c) for c in parents]

    # validate and find parent category
    id = validate_objectid(category_id)
    parent = cate_db.categories.find_one({"_id": id})
    if not parent:
        raise HTTPException(status_code=404, detail="Category not found")

    # recursive function to collect all subcategories
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

    # get all levels of subcategories
    all_children = get_all_children([id])

    # include parent itself
    result = [objectid_str(parent)] + [objectid_str(c) for c in all_children]
    return result

# ------------------- Update -------------------
@router.put("", response_model=CategoryResponse)
def update_category(
    category_id: str,
    category_name: str = Form(""),
    parent_id: str = Form(""),
    file: Union[UploadFile, None, str] = File(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        category_oid = ObjectId(category_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid category id")

    existing = cate_db.categories.find_one({"_id": category_oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")

    update_fields = {"updated_at": datetime.now()}

    # Update name if provided
    if category_name.strip():
        update_fields["category_name"] = category_name.strip()
    else:
        category_name = existing.get("category_name", "")

    # Update parent if provided
    if parent_id.strip():
        update_fields["parent_id"] = parent_id.strip()
    else:
        parent_id = existing.get("parent_id", "")

    # Always regenerate slug if name or parent changes
    parent_slug = ""
    if parent_id:
        try:
            parent_oid = ObjectId(parent_id)
            parent_category = cate_db.categories.find_one({"_id": parent_oid})
            if parent_category:
                parent_slug = parent_category.get("slug", "")
        except:
            pass

    new_slug = simple_slugify(category_name.strip())
    full_slug = f"{parent_slug}/{new_slug}" if parent_slug else new_slug
    update_fields["slug"] = generate_unique_slug(full_slug, cate_db.categories)

    # Handle file upload
    if file and hasattr(file, "filename") and file.filename:
        UPLOAD_DIR = "uploads/categories"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        update_fields["image"] = file_path.replace("\\", "/")
    else:
        update_fields["image"] = existing.get("image", "")

    cate_db.categories.update_one({"_id": category_oid}, {"$set": update_fields})

    updated_category = cate_db.categories.find_one({"_id": category_oid})
    return objectid_str(updated_category)


# ------------------- Delete -------------------
@router.delete("", response_model=dict)
def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    try:
        category_id = ObjectId(category_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid category id")

    category = cate_db.categories.find_one({"_id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    delete_category_and_children(cate_db.categories, str(category_id))
    return {"message": "Category and all its children deleted successfully"}



# @router.delete("/{category_id}", response_model=dict)
# def delete_category(category_id: str):
#     try:
#         category_id = ObjectId(category_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid category id")

#     result = cate_db.categories.delete_one({"_id": category_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Category not found")

#     return {"message": "Category deleted successfully"}








# @router.delete("/vendors", response_model=dict)
# def delete_all_vendors():
#     result = cate_db.vendors.delete_many({})  # Deletes all documents in the vendors collection
#     return {
#         "deleted_count": result.deleted_count,
#         "message": "All vendors have been deleted"
#     }
























#\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

# # ------------------- Subcategory -------------------

# #---------------- add -----------------------
# @router.post("/categories/{cate_id}/subcategories", response_model=SubcategoryResponse)
# def create_subcategory(cate_id: str, subcat: SubcategoryBase):
#     try:
#         cate_id = ObjectId(cate_id) 
#     except:
#         raise HTTPException(status_code=400, detail="Invalid category id")

    
#     parent_category = cate_db.categories.find_one({"_id": cate_id})
#     if not parent_category:
#         raise HTTPException(status_code=404, detail="Category not found")

#     subcat_dict = subcat.dict(exclude={"slug"})
#     subcat_dict["slug"] = generate_unique_slug(simple_slugify(subcat_dict["subcate_name"]), cate_db.subcategories)

#     subcat_dict["cate_id"] = cate_id  
#     result = cate_db.subcategories.insert_one(subcat_dict)

#     new_subcat = cate_db.subcategories.find_one({"_id": result.inserted_id})
#     return objectid_str(new_subcat)


# # ------------------- Get -------------------
# @router.get("/subcategories/", response_model=List[SubcategoryResponse])
# def list_subcategories():
#     subcate_list = []
#     for subcat in cate_db.subcategories.find():
#         subcate_list.append(objectid_str(subcat))
#     return subcate_list

# # ------------------- Update Subcategory -------------------
# @router.put("/categories/{cate_id}/subcategories/{subcat_id}", response_model=SubcategoryResponse)
# def update_subcategory(cate_id: str, subcat_id: str, subcat: SubcategoryBase):
#     try:
#         cate_id = ObjectId(cate_id)
#         subcat_id = ObjectId(subcat_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid ID format")

#     result = cate_db.subcategories.update_one(
#         {"_id": subcat_id, "cate_id": cate_id},
#         {"$set": subcat.dict()}
#     )
#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="Subcategory not found")

#     updated = cate_db.subcategories.find_one({"_id": subcat_id})
#     return objectid_str(updated)


# # ------------------- Delete Subcategory -------------------
# @router.delete("/categories/{cate_id}/subcategories/{subcat_id}", response_model=dict)
# def delete_subcategory(cate_id: str, subcat_id: str):
#     try:
#         cate_id = ObjectId(cate_id)
#         subcat_id = ObjectId(subcat_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid ID format")

#     result = cate_db.subcategories.delete_one({"_id": subcat_id, "cate_id": cate_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Subcategory not found")

#     return {"message": "Subcategory deleted successfully"}



# #---------------- add ---------------
# @router.post("/categories/{cate_id}/vendors", response_model=VendorResponse)
# def create_vendor(cate_id: str, vendor: VendorBase ):
#     # print(f"______________________________174: {subcate_id} {type(subcate_id)}")
#     try:
#         cate_id = ObjectId(cate_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid cate_id")
    
#     parent_subcategory = cate_db.subcategories.find_one({"_id": cate_id}) 
#     if not parent_subcategory:
#         raise HTTPException(status_code=404, detail="Subcategory not found")

#     vendor_dict = vendor.dict(exclude={"slug"})
#     vendor_dict["slug"] = generate_unique_slug(simple_slugify(vendor_dict["vendor_name"]), cate_db.vendors)

#     vendor_dict["subcate_id"] = cate_id 
#     print(cate_id)

#     result = cate_db.vendors.insert_one(vendor_dict)
#     new_vendor = cate_db.vendors.find_one({"_id": result.inserted_id})
#     return objectid_str(new_vendor)

# #----------------- get -------------------------
# @router.get("/vendors/", response_model=List[VendorResponse])
# def list_vendors():
#     vendors = []
#     for vendor in cate_db.vendors.find():
#         vendors.append(objectid_str(vendor))
#     return vendors

# # ------------------- Update -------------------
# @router.put("/subcategories/{subcate_id}/vendors/{vendor_id}", response_model=VendorResponse)
# def update_vendor(subcat_id: str, vendor_id: str, vendor: VendorBase):
#     try:
#         subcat_id = ObjectId(subcat_id)
#         vendor_id = ObjectId(vendor_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid ID format")

#     result = cate_db.vendors.update_one(
#         {"_id": vendor_id, "subcat_id": subcat_id},
#         {"$set": vendor.dict()}
#     )
#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="Vendor not found")

#     updated = cate_db.vendors.find_one({"_id": vendor_id})
#     return objectid_str(updated)


# # ------------------- Delete -------------------
# @router.delete("/subcategories/{subcate_id}/vendors/{vendor_id}", response_model=dict)
# def delete_vendor(subcat_id: str, vendor_id: str):
#     try:
#         subcat_id = ObjectId(subcat_id)
#         vendor_id = ObjectId(vendor_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid ID format")

#     result = cate_db.vendors.delete_one({"_id": vendor_id, "subcat_id": subcat_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Vendor not found")

#     return {"message": "Vendor deleted successfully"}



# # ---------------- Model CRUD ----------------

# #----------------- add -------------------
# @router.post("/vendors/models", response_model=ModelResponse)
# def create_model(vendor_id: str, model: ModelBase):
#     try:
#         vendor_id = ObjectId(vendor_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid cate_id")
    
#     parent_vendor = cate_db.vendor.find_one({"_id": vendor_id})
#     if not parent_vendor:
#         raise HTTPException(status_code=404, detail="Vendor not found")

#     model_dict = model.dict(exclude={"slug"})
#     model_dict["slug"] = generate_unique_slug(simple_slugify(model_dict["model_name"]), cate_db.models)

#     model_dict["vendor_id"] = vendor_id

#     result = cate_db.models.insert_one(model_dict)
#     new_model = cate_db.models.find_one({"_id": result.inserted_id})
#     return objectid_str(new_model)

# #----------- get ------------------
# @router.get("/models/", response_model=List[ModelResponse])
# def list_models():
#     models = []
#     for m in cate_db.models.find():
#         models.append(objectid_str(m))
#     return models

# # ------------------- Update -------------------
# @router.put("/vendors/{vendor_id}/models/{model_id}", response_model=ModelResponse)
# def update_model(vendor_id: str, model_id: str, model: ModelBase):
#     try:
#         vendor_id = ObjectId(vendor_id)
#         model_id = ObjectId(model_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid ID format")

#     result = cate_db.models.update_one(
#         {"_id": model_id, "vendor_id": vendor_id},
#         {"$set": model.dict()}
#     )
#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="Model not found")

#     updated = cate_db.models.find_one({"_id": model_id})
#     return objectid_str(updated)


# # ------------------- Delete -------------------
# @router.delete("/vendors/{vendor_id}/models/{model_id}", response_model=dict)
# def delete_model(vendor_id: str, model_id: str):
#     try:
#         vendor_id = ObjectId(vendor_id)
#         model_id = ObjectId(model_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid ID format")

#     result = cate_db.models.delete_one({"_id": model_id, "vendor_id": vendor_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Model not found")

#     return {"message": "Model deleted successfully"}

#-------------------- update_category --------------------------------
# @router.put("/{category_id}", response_model=CategoryResponse)
# def update_category(
#     category_id: str,
#     category_name: Optional[str] = Form(None),
#     slug: Optional[str] = Form(None),
#     parent_id: Optional[str] = Form(None, description=" ID or Leave empty id"),
#     file: Optional[UploadFile] = File(None)
# ):
#     # Convert category_id to ObjectId
#     try:
#         category_oid = ObjectId(category_id)
#     except:
#         raise HTTPException(status_code=400, detail="Invalid category id")

#     # Fetch existing category
#     existing = cate_db.categories.find_one({"_id": category_oid})
#     if not existing:
#         raise HTTPException(status_code=404, detail="Category not found")

#     image_path = existing.get("image")

#     # Build update dictionary
#     category_dict = {
#         "category_name": category_name or existing["category_name"],
#         "slug": slug or existing.get("slug"),
#         "parent_id": existing.get("parent_id"),
#         "updated_at": datetime.now(),
#         "image": image_path 
#     }

#     print("----cate ", category_dict)
#     # Handle file upload
#     if file:
#         UPLOAD_DIR = "uploads/categories"
#         os.makedirs(UPLOAD_DIR, exist_ok=True)
#         file_path = os.path.join(UPLOAD_DIR, file.filename)
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
#         image_path = file_path 

#     # Update in MongoDB
#     result = cate_db.categories.update_one({"_id": category_oid}, {"$set": category_dict})
#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="Category not found")

#     updated_category = cate_db.categories.find_one({"_id": category_oid})
#     return objectid_str(updated_category)














  
