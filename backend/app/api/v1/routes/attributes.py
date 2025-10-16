from fastapi import APIRouter, HTTPException, Form, Depends
from bson import ObjectId
from ....db.mongodb import cate_db
from app.core.security import get_current_user

# -------------------------------------------------
# ROUTER SETUP
# -------------------------------------------------
# This router handles all operations related to Product Attributes.
# Example: "Color", "Size", "Material", etc.
# Each attribute can have multiple possible values stored in another collection.
router = APIRouter(prefix="/Attribute", tags=["Attributes"])

# -------------------------------------------------
# MONGODB COLLECTIONS
# -------------------------------------------------
# Using separate collections for:
#   - attributes → stores attribute names like "Color", "Size"
#   - attribute_values → stores values like "Red", "Blue", "Large"
attribute_collection = cate_db.attributes
value_collection = cate_db.attribute_values


# -------------------------------------------------
# ADD NEW ATTRIBUTE
# -------------------------------------------------
@router.post("/add")
def add_attribute(name: str = Form(..., example="Color"),current_user: dict = Depends(get_current_user)):
    """
    Add a new attribute (e.g., Color, Size, Material).

    👉 Only admins (or sellers with permission) should access this endpoint.

    Example Input:
        name = "Color"

    Steps:
        1. Check if an attribute with this name already exists.
        2. If not, insert it into the database.
    """
    if attribute_collection.find_one({"name": name}):
        raise HTTPException(status_code=400, detail="Attribute already exists")

    result = attribute_collection.insert_one({"name": name})
    return {"message": "Attribute added successfully", "id": str(result.inserted_id)}


# -------------------------------------------------
# GET ATTRIBUTE BY ID
# -------------------------------------------------
@router.get("/{attribute_id}")
def get_attribute(attribute_id: str):
    """
    Fetch a single attribute by its MongoDB ID.

    Example:
        /Attribute/652b7ad...xyz

    Returns:
        {
            "_id": "652b7ad...xyz",
            "name": "Color"
        }
    """
    attribute = attribute_collection.find_one({"_id": ObjectId(attribute_id)})
    if not attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")

    attribute["_id"] = str(attribute["_id"])
    return {"attribute": attribute}


# -------------------------------------------------
# GET ALL ATTRIBUTES (with values)
# -------------------------------------------------
@router.get("/")
def get_all_attributes():
    """
    Get a list of all available attributes and their possible values.

    Example Output:
        {
            "attributes": [
                {
                    "_id": "652b7...",
                    "name": "Color",
                    "values": ["Red", "Blue", "Green"]
                },
                {
                    "_id": "652b8...",
                    "name": "Size",
                    "values": ["S", "M", "L"]
                }
            ]
        }
    """

    attributes = list(attribute_collection.find({}))

    # Attach related values for each attribute
    for attr in attributes:
        attr_id_str = str(attr["_id"])
        attr["_id"] = attr_id_str

        # Fetch all values linked to this attribute
        values = list(value_collection.find({"attribute_id": attr_id_str}))
        attr["values"] = [v["value"] for v in values]  # Only include the value names

    return {"attributes": attributes}


# -------------------------------------------------
# UPDATE ATTRIBUTE NAME
# -------------------------------------------------
@router.put("/{attribute_id}")
def update_attribute(attribute_id: str, new_name: str = Form(...),current_user: dict = Depends(get_current_user)):
    """
    Update an existing attribute's name.

    Example:
        Change "Colour" → "Color"

    Steps:
        1. Check if attribute exists.
        2. Ensure new name isn't already used.
        3. Update the attribute name.
    """
    if not attribute_collection.find_one({"_id": ObjectId(attribute_id)}):
        raise HTTPException(status_code=404, detail="Attribute not found")

    if attribute_collection.find_one({"name": new_name}):
        raise HTTPException(status_code=400, detail="Attribute name already exists")

    attribute_collection.update_one(
        {"_id": ObjectId(attribute_id)},
        {"$set": {"name": new_name}}
    )

    return {"message": "Attribute updated successfully"}


# -------------------------------------------------
# DELETE ATTRIBUTE (and its values)
# -------------------------------------------------
@router.delete("/{attribute_id}")
def delete_attribute(attribute_id: str,current_user: dict = Depends(get_current_user)):
    """
    Delete an attribute and all its associated values.

    Example:
        Delete "Color" will also delete "Red", "Blue", etc.

    Steps:
        1. Check if attribute exists.
        2. Remove all values linked to it from 'attribute_values' collection.
        3. Delete the attribute itself.
    """
    if not attribute_collection.find_one({"_id": ObjectId(attribute_id)}):
        raise HTTPException(status_code=404, detail="Attribute not found")

    # Delete all values linked to this attribute
    value_collection.delete_many({"attribute_id": attribute_id})

    # Delete the attribute
    attribute_collection.delete_one({"_id": ObjectId(attribute_id)})

    return {"message": "Attribute and its values deleted successfully"}
