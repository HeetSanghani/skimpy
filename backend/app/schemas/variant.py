# backend/app/api/v1/schemas/variant.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


# ---------------- Variant Attribute Schema ----------------
class VariantAttribute(BaseModel):
    attribute_id: str
    value_id: str


# ---------------- Variant Base Schema ----------------
class VariantBase(BaseModel):
    sku: Optional[str] = None
    price: float
    stock: int
    attributes: List[VariantAttribute] = []
    images: Optional[List[str]] = []


# ---------------- Variant Create Schema ----------------
class VariantCreate(VariantBase):
    product_id: str


# ---------------- Variant Response Schema ----------------
class VariantResponse(VariantBase):
    id: Optional[str] = Field(default=None, alias="_id")
    product_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True
        orm_mode = True
        json_encoders = {ObjectId: str}




























# from typing import List, Optional
# from datetime import datetime
# from pydantic import BaseModel, Field

# # ---------------- Variant Attribute Schema ----------------
# class VariantAttribute(BaseModel):
#     attribute_id: str
#     value_id: str

# # ---------------- Variant Base Schema ----------------
# class VariantBase(BaseModel):
#     sku: Optional[str] = None
#     price: float
#     stock: int
#     attributes: List[VariantAttribute] = []
#     images: Optional[List[str]] = []

# # ---------------- Variant Create Schema ----------------
# class VariantCreate(VariantBase):
#     pass

# # ---------------- Variant Response Schema ----------------
# class VariantResponse(VariantBase):
#     id: Optional[str] = Field(default=None, alias="_id")
#     product_id: Optional[str] = None
#     created_at: datetime
#     updated_at: datetime

#     class Config:
#         allow_population_by_field_name = True
#         orm_mode = True
