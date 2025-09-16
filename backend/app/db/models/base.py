# app/db/models/base.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


# Shared Base Model
class CustomBaseModel(BaseModel):

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        orm_mode = True
