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



