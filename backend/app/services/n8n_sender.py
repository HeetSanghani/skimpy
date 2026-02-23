import os
import requests
import logging
import datetime

logger = logging.getLogger(__name__)

def trigger_signup_notification(user_data: dict):
    """
    Triggers the n8n webhook for signup notification.
    
    Args:
        user_data (dict): Dictionary containing user details like user_id, email, first_name.
    """
    webhook_url = os.getenv("N8N_SIGNUP_WEBHOOK_URL")
    
    if not webhook_url:
        logger.warning("N8N_SIGNUP_WEBHOOK_URL is not set. Skipping signup notification.")
        return

    try:
        # Prepare payload
        payload = {
            "user_id": user_data.get("user_id"),
            "email": user_data.get("email"),
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            "created_at": str(user_data.get("created_date")),
            # Extra fields
            "name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            "ip": user_data.get("ip"),
            "device": user_data.get("device")
        }

        # Send POST request
        response = requests.post(webhook_url, json=payload, timeout=5)
        
        if response.status_code == 200:
            logger.info(f"Successfully triggered n8n signup notification for user {user_data.get('email')}")
        else:
            logger.error(f"Failed to trigger n8n signup notification. Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        logger.error(f"Error triggering n8n signup notification: {str(e)}")


def trigger_login_notification(user_data: dict):
    """
    Triggers the n8n webhook for login success notification.
    
    Args:
        user_data (dict): Dictionary containing user details.
    """
    webhook_url = os.getenv("N8N_LOGIN_SUCCESS_WEBHOOK_URL")
    
    if not webhook_url:
        logger.warning("N8N_LOGIN_SUCCESS_WEBHOOK_URL is not set. Skipping login notification.")
        return

    try:
        # Prepare payload
        payload = {
            "user_id": user_data.get("user_id"),
            "email": user_data.get("email"),
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            # Extra fields for n8n email template
            "name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            "login_time": user_data.get("login_time"),
            "ip": user_data.get("ip"),
            "device": user_data.get("device")
        }

        # Send POST request
        response = requests.post(webhook_url, json=payload, timeout=20)
        
        if response.status_code == 200:
            logger.info(f"Successfully triggered n8n login notification for user {user_data.get('email')}")
        else:
            logger.error(f"Failed to trigger n8n login notification. Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        logger.error(f"Error triggering n8n login notification: {str(e)}")

def trigger_otp_verified_notification(email: str):
    """
    Triggers the n8n webhook when OTP is successfully verified.
    
    Args:
        email (str): The email address of the user who verified the OTP.
    """
    webhook_url = os.getenv("N8N_OTP_VERIFIED_WEBHOOK_URL")
    
    if not webhook_url:
        logger.warning("N8N_OTP_VERIFIED_WEBHOOK_URL is not set. Skipping OTP verified notification.")
        return

    try:
        # Prepare payload
        payload = {
            "email": email,
            "timestamp": str(datetime.datetime.now())
        }

        # Send POST request
        response = requests.post(webhook_url, json=payload, timeout=20)
        
        if response.status_code == 200:
            logger.info(f"Successfully triggered n8n OTP verification for user {email}")
        else:
            logger.error(f"Failed to trigger n8n OTP verification. Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        logger.error(f"Error triggering n8n OTP verification: {str(e)}")

def trigger_order_success_notification(user_data: dict, order_summary: dict):
    """
    Triggers the n8n webhook for order success (invoice).
    
    Args:
        user_data (dict): User details (email, name).
        order_summary (dict): Order details (total amount, items, order_ids).
    """
    webhook_url = os.getenv("N8N_ORDER_SUCCESS_WEBHOOK_URL")
    
    if not webhook_url:
        logger.warning("N8N_ORDER_SUCCESS_WEBHOOK_URL is not set. Skipping order notification.")
        return

    try:
        # Prepare payload
        payload = {
            "user": user_data,
            "order": order_summary,
            "timestamp": str(datetime.datetime.now())
        }

        # Send POST request
        response = requests.post(webhook_url, json=payload, timeout=20)
        
        if response.status_code == 200:
            logger.info(f"Successfully triggered n8n order notification for user {user_data.get('email')}")
        else:
            logger.error(f"Failed to trigger n8n order notification. Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        logger.error(f"Error triggering n8n order notification: {str(e)}")

def trigger_send_otp_notification(email: str, otp: str) -> bool:
    """
    Triggers the n8n webhook to send an OTP email.
    Returns True if n8n accepted the request (HTTP 200), False otherwise.
    Payload matches n8n Gmail node: $json.body.email, $json.body.otp
    Retries once after 5s on timeout/connection error to handle n8n cold start.
    """
    import time

    webhook_url = (os.getenv("N8N_SEND_OTP_WEBHOOK_URL") or "").strip()
    if not webhook_url:
        logger.warning("N8N_SEND_OTP_WEBHOOK_URL is not set. Skipping n8n OTP.")
        return False

    payload = {
        "email": email,
        "otp": otp,
        "timestamp": str(datetime.datetime.now())
    }
    headers = {"Content-Type": "application/json"}
    timeout_seconds = 45

    for attempt in range(2):
        try:
            response = requests.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=timeout_seconds
            )
            if response.status_code == 200:
                logger.info(f"Successfully triggered n8n OTP send for user {email}")
                return True
            logger.error(
                f"n8n OTP webhook failed (attempt {attempt + 1}). Status: {response.status_code}, Response: {response.text[:500]}"
            )
            if attempt == 0 and response.status_code in (502, 503, 504):
                time.sleep(5)
                continue
            return False
        except requests.exceptions.Timeout:
            logger.warning("n8n OTP webhook timed out (attempt %d).", attempt + 1)
            if attempt == 0:
                time.sleep(5)
                continue
            return False
        except requests.exceptions.RequestException as e:
            logger.warning("n8n OTP webhook error (attempt %d): %s", attempt + 1, e)
            if attempt == 0:
                time.sleep(5)
                continue
            return False
    return False
