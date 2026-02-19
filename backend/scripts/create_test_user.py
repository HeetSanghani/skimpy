import sys
import os
import uuid
from datetime import datetime

# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import user_collection
from app.core.security import get_password_hash

def create_test_user():
    email = "mobiletest@skimpy.com"
    password = "password123"
    
    existing_user = user_collection.find_one({"email": email})
    if existing_user:
        print(f"User {email} already exists.")
        return

    hashed_password = get_password_hash(password)
    
    user_data = {
        "user_id": str(uuid.uuid4()),
        "email": email,
        "password": hashed_password,
        "first_name": "Mobile",
        "last_name": "Tester",
        "is_active": True,
        "is_superuser": False,
        "verified": True, # Important: Bypass OTP
        "created_date": datetime.now()
    }
    
    user_collection.insert_one(user_data)
    print(f"User {email} created successfully.")

if __name__ == "__main__":
    create_test_user()
