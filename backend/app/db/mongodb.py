
from pymongo.mongo_client import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()


uri = os.getenv("MONGO_URI")
                
if not uri:
    raise ValueError("MONGO_URI not set in .env file")
                
# Create a new client and connect to the server
client = MongoClient(uri)

db = client["skimpy"]              # database
user_collection = db["users"]# collection
otp_collection = db["otp"]

user_collection.create_index("email", unique=True)
user_collection.create_index("user_id", unique=True)

otp_collection.create_index("created_at", expireAfterSeconds=300)


