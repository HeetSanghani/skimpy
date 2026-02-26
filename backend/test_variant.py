import requests
import jwt
from datetime import datetime, timedelta

import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here") # from backend env
ALGORITHM = "HS256"

# Let's create a token for user
data = {"sub": "test@example.com", "user_id": "699db8a70ea0bfb458bfb517"} # Any user ID
to_encode = data.copy()
expire = datetime.utcnow() + timedelta(minutes=15)
to_encode.update({"exp": expire})
encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

headers = {
    "Authorization": f"Bearer {encoded_jwt}"
}
url = "https://skimpy-backend.onrender.com/Variant/add/69a01bb4145c2690ffceab5f"

payload = {
    "price": "10.0",
    "stock": "5",
    "attribute_values": '[{"attribute_id": "699ea56678303c06048ae8d8", "value_id": "699ef7e3de064050653b1eb7"}]'
}

response = requests.post(url, data=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response:", response.text)
