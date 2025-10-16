from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

class AttributeBase(BaseModel):
    name: str

class AttributeCreate(AttributeBase):
    pass

class AttributeInDB(AttributeBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class AttributeValueBase(BaseModel):
    attribute_id: str
    value: str

class AttributeValueCreate(AttributeValueBase):
    pass

class AttributeValueInDB(AttributeValueBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
