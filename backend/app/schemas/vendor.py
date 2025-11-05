from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

# ---------------- Vendor ----------------
class VendorBase(BaseModel):
    user_id: Optional[str] = None
    shop_name: str
    image: Optional[str] = None
    address: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None  
class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str  
        }

