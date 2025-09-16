
from pymongo.mongo_client import MongoClient

uri = "mongodb+srv://akshay:akshay1234@skimpy.vhdtrbd.mongodb.net/?retryWrites=true&w=majority&appName=skimpy"

# Create a new client and connect to the server
client = MongoClient(uri)

db = client["skimpy"]              # database
user_collection = db["users"]# collection
otp_collection = db["otp"]

user_collection.create_index("email", unique=True)
user_collection.create_index("user_id", unique=True)

otp_collection.create_index("created_at", expireAfterSeconds=300)


