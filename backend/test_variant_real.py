from pymongo import MongoClient
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Find an admin or seller user in DB to login as
mongo_url = os.getenv("MONGODB_URL")
client = MongoClient(mongo_url)
db = client.get_database("skimpy")
user = db.users.find_one({"role": "SELLER"})

if not user:
    print("No seller found.")
    exit(1)

email = user['email']
# we don't know the password... let's just generate a token manually

import jwt
from datetime import datetime, timedelta

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"

data = {"sub": email, "user_id": str(user['_id'])}
expire = datetime.utcnow() + timedelta(minutes=15)
data.update({"exp": expire})
token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

url = "https://skimpy-backend.onrender.com/Variant/add/69a01bb4145c2690ffceab5f"
headers = {
    "Authorization": f"Bearer {token}"
}

payload = {
    "price": "10.0",
    "stock": "5",
    "attribute_values": '[TODO_REPLACE_WITH_VALID_ATTRS]',
    "product_condition": "NEW",
    "description": "test desc",
}

# we need valid attribute ids
attrs = list(db.attributes.find().limit(1))
val = list(db.attribute_values.find({"attribute_id": str(attrs[0]['_id'])}).limit(1))
if attrs and val:
    attr_id = str(attrs[0]['_id'])
    val_id = str(val[0]['_id'])
    payload["attribute_values"] = f'[{{"attribute_id": "{attr_id}", "value_id": "{val_id}"}}]'
else:
    payload["attribute_values"] = "[]"

print(f"Sending payload: {payload}")
response = requests.post(url, data=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response:", response.text)

