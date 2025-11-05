from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId



# ---------------- Category ----------------
class CategoryBase(BaseModel):
    category_name: str
    image: Optional[str] = None
    slug: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None  
    parent_id: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}  







