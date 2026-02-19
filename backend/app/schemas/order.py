from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class OrderItem(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    name: str 
    price: float
    quantity: int
    image: Optional[str] = None

class ShippingAddress(BaseModel):
    fullname: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None

class OrderCreate(BaseModel):
    # This might be used if we allow direct order creation API, 
    # but mostly we create from Cart/Session. Keeping it simple.
    pass

class OrderResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    vendor_id: str
    order_id: str # Readable ID like ORD-123456
    
    products: List[OrderItem]
    total_amount: float
    status: str
    
    shipping_address: Optional[ShippingAddress] = None
    payment_status: str
    
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
