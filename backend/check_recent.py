from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
mongo_url = os.getenv("MONGODB_URL")

client = MongoClient(mongo_url)
db = client.get_database("skimpy")

products = list(db.products.find().sort("_id", -1).limit(1))
variants = list(db.variants.find().sort("_id", -1).limit(5))

print(f"Latest product: {products}")
print(f"Latest variants: {variants}")
