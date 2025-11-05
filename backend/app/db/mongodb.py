from pymongo import MongoClient
from dotenv import load_dotenv
import os
load_dotenv()
# ---------- USER DATABASE ----------
MONGO_URI = os.getenv("MONGO_URI")  # example: mongodb://localhost:27017
if not MONGO_URI:
    raise ValueError("MONGO_URI not set in .env file")
user_client = MongoClient(MONGO_URI)
user_db = user_client["skimpy"]  # main user database
# Collections for user DB
user_collection = user_db["users"]
otp_collection = user_db["otp"]
delivery_addresses_collection = user_db["delivery_addresses"]
# Indexes
user_collection.create_index("email", unique=True)
user_collection.create_index("user_id", unique=True)
otp_collection.create_index("created_at", expireAfterSeconds=300)
MONGO_URL = os.getenv("MONGO_URL")  # example: mongodb://localhost:27017
if not MONGO_URL:
    raise ValueError("MONGO_URL not set in .env file")
cate_client = MongoClient(MONGO_URL)
cate_db = cate_client["cate"]  # separate DB for categories, vendors, products
# Collections for product DB
category_collection = cate_db["categories"]
vendor_collection = cate_db["vendor"]
product_collection = cate_db["Heet-products"]
# Indexes
category_collection.create_index("slug", unique=True)
vendor_collection.create_index("slug", unique=True)
product_collection.create_index("slug", unique=True)