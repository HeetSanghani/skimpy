
from pymongo.mongo_client import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

# ---------- User DB ----------
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not set in .env file")

user_client = MongoClient(MONGO_URI)
user_db = user_client["skimpy"]

user_collection = user_db["users"]
otp_collection = user_db["otp"]
delivery_addresses_collection = user_db["delivery_addresses"]

user_collection.create_index("email", unique=True)
user_collection.create_index("user_id", unique=True)
otp_collection.create_index("created_at", expireAfterSeconds=300)


# ---------- Categories/Products DB ----------
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise ValueError("MONGO_URL not set in .env file")

cate_client = AsyncIOMotorClient(MONGO_URL)
cate_db = cate_client["cate"]

category_collection = cate_db["categories"]
subcategory_collection = cate_db["subcategory"]
vendor_collection = cate_db["vendor"]
model_collection = cate_db["model"]
product_collection = cate_db["products"]
