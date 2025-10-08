
# from typing import Optional
# from enum import Enum
# from datetime import datetime
# from pydantic import BaseModel, Field
# from bson import PyObjectId

# class ProductCondition(str, Enum):
#     NEW = "new"
#     CHANGE = "Refurbished"
#     OLD = "old"

# class Category(BaseModel):
#     _id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
#     cate_name: str
#     image: Optional[str] = None
#     slug: Optional[str] = None
#     created_at: datetime = Field(default_factory=datetime.now)
#     cate_id: Optional[str] = None

# # class subcategory(BaseModel):
# #     _id: PyObjectId = Field(..., alias="_id")
# #     subcate_name: str
# #     image: Optional[str] = None
# #     slug: Optional[str] = None
# #     created_at: datetime = datetime.now()
# #     cate_id: Optional[str] = None

# # class vendor(BaseModel):
# #     _id: ObjectId = Field(..., alias="_id")
# #     vendor_name: str
# #     image: Optional[str] = None
# #     slug: Optional[str] = None
# #     created_at: datetime = datetime.now()
# #     subcate_id: Optional[str] = None

# # class Model(BaseModel):
# #     _id: ObjectId = Field(..., alias="_id")
# #     model_name: str
# #     image: Optional[str] = None
# #     slug: Optional[str] = None
# #     created_at: datetime = datetime.now()
# #     vendor_id: Optional[str] = None

# class Product(BaseModel):
#     product_name: str
#     product_image: Optional[str] = None
#     content: Optional[str] = None
#     price: float
#     stock: int
#     product_condition: ProductCondition = ProductCondition.NEW 
#     created_at: datetime = Field(default_factory=datetime.now)
#     vendor_id: Optional[PyObjectId] = None
#     model_id: PyObjectId  
