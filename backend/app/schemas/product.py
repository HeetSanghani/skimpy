# backend/app/api/v1/schemas/product.py
from typing import List, Optional
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


# ---------------- Product Condition Enum ----------------
class ProductCondition(str, Enum):
    NEW = "NEW"
    USED = "USED"
    REFURBISHED = "REFURBISHED"


# ---------------- Product Base Schema ----------------
class ProductBase(BaseModel):
    product_name: str
    description: Optional[str] = None
    price: float
    stock: int
    product_condition: ProductCondition = ProductCondition.NEW
    brand: Optional[str] = None
    images: Optional[List[str]] = []  # supports multiple images
    category_id: Optional[str] = None
    vendor_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# ---------------- Product Create Schema ----------------
class ProductCreate(ProductBase):
    pass


# ---------------- Product Response Schema ----------------
class ProductResponse(ProductBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        allow_population_by_field_name = True
        orm_mode = True
        json_encoders = {ObjectId: str}




















































# from typing import List, Optional
# from enum import Enum
# from datetime import datetime
# from pydantic import BaseModel, Field
# from bson import ObjectId
# from .variant import VariantCreate

# # ---------------- Product Condition Enum ----------------
# class ProductCondition(str, Enum):
#     NEW = "NEW"
#     USED = "USED"
#     REFURBISHED = "REFURBISHED"

# # ---------------- Product Base Schema ----------------
# class ProductBase(BaseModel):
#     product_name: str
#     description: Optional[str] = None
#     price: float
#     stock: int
#     product_condition: ProductCondition = ProductCondition.NEW
#     images: Optional[List[str]] = []  # supports multiple images
#     category_id: Optional[str] = None
#     vendor_id: Optional[str] = None
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     updated_at: Optional[datetime] = None

# # ---------------- Product Create Schema ----------------
# class ProductCreate(ProductBase):
#     variants: Optional[List[VariantCreate]] = []
#     pass

# # ---------------- Product Response Schema ----------------
# class ProductResponse(ProductBase):
#     id: Optional[str] = Field(default=None, alias="_id")

#     class Config:
#         allow_population_by_field_name = True  # allows using id instead of _id
#         orm_mode = True
#         json_encoders = {
#             ObjectId: str  # converts MongoDB ObjectId to string
#         }
