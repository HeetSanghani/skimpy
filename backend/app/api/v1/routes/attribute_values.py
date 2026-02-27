from fastapi import APIRouter, HTTPException, Form, Depends
from bson import ObjectId
from ....db.mongodb import cate_db
from app.security.dependencies import get_current_user

# -------------------------------------------------
# ROUTER SETUP
# -------------------------------------------------
# This router handles all operations related to Attribute Values.
# Each value belongs to an attribute, e.g., Attribute = "Color", Value = "Red"
router = APIRouter(prefix="/AttributeValue", tags=["Attribute Values"])

# -------------------------------------------------
# MONGODB COLLECTIONS
# -------------------------------------------------
# attribute_collection → stores attributes like "Color", "Size"
# value_collection → stores values like "Red", "Blue", "Large"
attribute_collection = cate_db.attributes
value_collection = cate_db.attribute_values


# -------------------------------------------------
# ADD ATTRIBUTE VALUE
# -------------------------------------------------
@router.post("/add")
def add_attribute_value(
    attribute_id: str = Form(..., example="670e8b3f111111111"),
    value: str = Form(..., example="Red"), current_user: dict = Depends(get_current_user)
):
    """
    Add a new value for a specific attribute.

    Example:
        Attribute = "Color"
        Value = "Red"

    Steps:
        1. Check if the parent attribute exists.
        2. Check if the value already exists for this attribute.
        3. Insert the new value into the 'attribute_values' collection.
    """
    if not attribute_collection.find_one({"_id": ObjectId(attribute_id)}):
        raise HTTPException(status_code=404, detail="Attribute not found")

    if value_collection.find_one({"attribute_id": attribute_id, "value": value}):
        raise HTTPException(status_code=400, detail="Value already exists for this attribute")

    result = value_collection.insert_one({"attribute_id": attribute_id, "value": value})
    return {"message": "Attribute value added successfully", "id": str(result.inserted_id)}


# -------------------------------------------------
# GET ATTRIBUTE VALUE BY ID
# -------------------------------------------------
@router.get("/{value_id}")
def get_attribute_value(value_id: str):
    """
    Fetch a single attribute value by its MongoDB ID.

    Example Output:
        {
            "_id": "652b7ad...xyz",
            "attribute_id": "652b7ad...abc",
            "value": "Red"
        }
    """
    value = value_collection.find_one({"_id": ObjectId(value_id)})
    if not value:
        raise HTTPException(status_code=404, detail="Attribute value not found")

    value["_id"] = str(value["_id"])
    return {"attribute_value": value}


# -------------------------------------------------
# GET ALL ATTRIBUTE VALUES
# -------------------------------------------------
@router.get("/")
def get_all_attribute_values():
    """
    Return all attribute values for all attributes.

    Example Output:
        [
            { "_id": "1", "attribute_id": "a1", "value": "Red" },
            { "_id": "2", "attribute_id": "a1", "value": "Blue" },
            { "_id": "3", "attribute_id": "a2", "value": "S" }
        ]
    """
    values = list(value_collection.find({}))
    for v in values:
        v["_id"] = str(v["_id"])
    return {"attribute_values": values}


# -------------------------------------------------
# UPDATE ATTRIBUTE VALUE
# -------------------------------------------------
@router.put("/{value_id}")
def update_attribute_value(value_id: str, new_value: str = Form(...),current_user: dict = Depends(get_current_user)):
    """
    Update the name of a specific attribute value.

    Steps:
        1. Check if the value exists.
        2. Ensure the new value does not already exist for the same attribute.
        3. Update the value in the database.
    """
    value = value_collection.find_one({"_id": ObjectId(value_id)})
    if not value:
        raise HTTPException(status_code=404, detail="Attribute value not found")

    existing = value_collection.find_one({
        "attribute_id": value["attribute_id"],
        "value": new_value
    })
    if existing:
        raise HTTPException(status_code=400, detail="This value already exists for the same attribute")

    value_collection.update_one({"_id": ObjectId(value_id)}, {"$set": {"value": new_value}})
    return {"message": "Attribute value updated successfully"}


# -------------------------------------------------
# DELETE ATTRIBUTE VALUE
# -------------------------------------------------
@router.delete("/{value_id}")
def delete_attribute_value(value_id: str,current_user: dict = Depends(get_current_user)):
    """
    Delete a specific attribute value.

    Steps:
        1. Check if the value exists.
        2. Delete the value from the 'attribute_values' collection.
    """
    if not value_collection.find_one({"_id": ObjectId(value_id)}):
        raise HTTPException(status_code=404, detail="Attribute value not found")

    value_collection.delete_one({"_id": ObjectId(value_id)})
    return {"message": "Attribute value deleted successfully"}


# -------------------------------------------------
# GET ALL ATTRIBUTES WITH THEIR VALUES
# -------------------------------------------------
@router.get("/with_attributes/all")
def get_attributes_with_values():
    """
    Return all attributes along with their associated values.

    Example Output:
        [
            { "attribute_id": "a1", "name": "Color", "values": ["Red", "Blue"] },
            { "attribute_id": "a2", "name": "Size", "values": ["S", "M", "L"] }
        ]

    Steps:
        1. Fetch all attributes.
        2. For each attribute, fetch its values from 'attribute_values'.
        3. Return a combined response.
    """
    attributes = list(attribute_collection.find({}))
    response = []

    for attr in attributes:
        attr_values = list(value_collection.find({"attribute_id": str(attr["_id"])}))
        values = [v["value"] for v in attr_values]

        response.append({
            "attribute_id": str(attr["_id"]),
            "name": attr["name"],
            "values": values
        })

    return {"attributes": response}
