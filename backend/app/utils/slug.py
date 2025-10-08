import re
from bson import ObjectId


def simple_slugify(name: str) -> str:
    """Convert text into URL-safe slug"""
    name = name.lower()
    name = re.sub(r"[^a-z0-9]+", "-", name)
    return name.strip("-")


def generate_unique_slug(base_slug, collection, parent_id=None):

    slug = base_slug

    if parent_id:
        try:
            if not ObjectId.is_valid(parent_id):
                raise ValueError("Invalid parent_id format")
            parent = collection.find_one({"_id": ObjectId(parent_id)})
            if parent and "slug" in parent:
                parent_slug = parent["slug"]
                slug = f"{parent_slug}/{slug}"
        except Exception as e:
            print(f"Warning: invalid parent ID or parent not found: {e}")

    counter = 1
    unique_slug = slug
    while collection.find_one({"slug": unique_slug}):
        unique_slug = f"{slug}-{counter}"
        counter += 1

    return unique_slug



def delete_category_and_children(collection, category_id):
    
    children = collection.find({"parent_id": category_id})
    for child in children:
        delete_category_and_children(collection, str(child["_id"]))

    collection.delete_one({"_id": ObjectId(category_id)})
