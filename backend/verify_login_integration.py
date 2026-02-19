import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Add backend directory to sys.path
sys.path.append(os.path.abspath("/home/python/skimpy/backend"))

# Load env vars BEFORE importing app modules
from dotenv import load_dotenv
load_dotenv("/home/python/skimpy/backend/.env")

# Mock the database/auth dependencies before importing auth logic
# This prevents actual DB connection attempts if not needed
sys.modules['app.db.mongodb'] = MagicMock()
sys.modules['app.core.security'] = MagicMock()

# Now import the target service
from app.services import auth

class TestLoginWebhook(unittest.TestCase):
    @patch('app.services.auth.user_collection')
    @patch('app.services.auth.verify_password')
    @patch('app.services.auth.create_access_token')
    @patch('app.services.auth.trigger_login_notification')
    def test_login_triggers_webhook(self, mock_trigger, mock_create_token, mock_verify, mock_user_collection):
        # Setup Mocks
        mock_user = {
            "email": "test@example.com",
            "password": "hashed_secret",
            "user_id": "123"
        }
        mock_user_collection.find_one.return_value = mock_user
        mock_verify.return_value = True # Password matches
        mock_create_token.return_value = "fake_token"

        # Execute
        print("Calling login_logic...")
        response = auth.login_logic("test@example.com", "secret")

        # Verify
        print("Checking if trigger_login_notification was called...")
        mock_trigger.assert_called_once_with(mock_user)
        print("SUCCESS: trigger_login_notification was called with user data.")

if __name__ == '__main__':
    unittest.main()