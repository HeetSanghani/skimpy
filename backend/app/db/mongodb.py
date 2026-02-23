from pymongo import MongoClient
from dotenv import load_dotenv
import os
load_dotenv()
import certifi
import ssl

# ---------- DATABASE CONNECTION ----------
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    # Fallback for backward compatibility or local dev if needed, but prefer MONGODB_URL
    MONGODB_URL = os.getenv("MONGO_URI") or os.getenv("MONGO_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL not set in .env file")

# Create a custom SSL context to allow connection even if certificate verification fails
# This is often needed in certain deployment environments or local setups with proxy/SSL issues
client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
user_db = client["skimpy"]  # Main database for Users
cate_db = client["skimpy"]  # Same database for Products/Categories (Consolidated)

# For backward compatibility if strictly needed, we can alias clients
user_client = client
cate_client = client

# Collections for user DB
user_collection = user_db["users"]
otp_collection = user_db["otp"]
delivery_addresses_collection = user_db["delivery_addresses"]
contact_messages_collection = user_db["contact_messages"]

# User Indexes
user_collection.create_index("email", unique=True)
user_collection.create_index("user_id", unique=True)
# Auto-remove OTP documents when expires_at has passed (TTL index)
otp_collection.create_index("expires_at", expireAfterSeconds=0)

# Collections for product DB
# Collections for product DB
# Collections for product DB
category_collection = cate_db["categories"]
vendor_collection = cate_db["vendors"] # Was vendor (singular)
product_collection = cate_db["products"] # Was Heet-products
cart_collection = user_db["cart"] # Was cate_db["cart"]
variant_collection = cate_db["variants"]
order_collection = cate_db["orders"]
# Indexes
# Indexes
category_collection.create_index("slug", unique=True) # Category slugs should be unique/exist
vendor_collection.create_index("slug", unique=True, sparse=True) # Vendors might lack slugs initially
product_collection.create_index("slug", unique=True, sparse=True) # Products might lack slugs