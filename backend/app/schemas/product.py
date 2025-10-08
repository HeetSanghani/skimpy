from typing import Optional
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


# ---------------- Enum ----------------
class ProductCondition(str, Enum):
    NEW = "new"
    REFURBISHED = "Refurbished"
    OLD = "old"


# ---------------- Product ----------------
class ProductBase(BaseModel):
    product_name: str
    image: Optional[str] = None
    description: Optional[str] = None
    price: float
    stock: int
    product_condition: ProductCondition = ProductCondition.NEW
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None 
    category_id: Optional[str] = None  
    vendor_id: Optional[str] = None 

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str   
        }

