from fastapi import APIRouter, HTTPException, Body, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from bson import ObjectId

from ....db.mongodb import contact_messages_collection, cate_db
from app.core.security import get_current_user
from .chat import SKIMPY_SUPPORT_ID

# Chat collections
conversations = cate_db["conversations"]
messages = cate_db["messages"]

router = APIRouter(prefix="/contact", tags=["Contact"])

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    category: str

@router.post("/")
async def send_contact_message(
    contact_data: ContactMessage,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Submit a contact form message.
    If authenticated -> Starts a Chat with SKIMPY_SUPPORT_ID.
    If guest -> Saves to contact_messages collection.
    """
    try:
        user_id = str(current_user.get("user_id")) if current_user else None

        # ---------------- LOGGED IN: SEND VIA CHAT ----------------
        if user_id:
            # 1. Find or Create Conversation
            existing = conversations.find_one({
                "participants": {"$all": [user_id, SKIMPY_SUPPORT_ID]}
            })

            if existing:
                conversation_id = str(existing["_id"])
                conversations.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"updated_at": datetime.utcnow()}}
                )
            else:
                # Create new
                new_conv = {
                    "participants": [user_id, SKIMPY_SUPPORT_ID],
                    "product_id": None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "last_text": "",
                    "vendor_id": None,
                    "vendor_user_id": SKIMPY_SUPPORT_ID,
                    "is_support_chat": True
                }
                res = conversations.insert_one(new_conv)
                conversation_id = str(res.inserted_id)

            # 2. Insert User Message
            full_text = f"Category: {contact_data.category}\nSubject: {contact_data.subject}\n\n{contact_data.message}"
            
            user_msg_doc = {
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "text": full_text,
                "created_at": datetime.utcnow(),
                "read_by": [user_id]
            }
            messages.insert_one(user_msg_doc)

            # 3. Insert Auto-Reply (Immediate)
            auto_reply_text = (
                f"Hi {contact_data.name},\n"
                f"Thank you for contacting Skimpy Support.\n"
                f"We’ve received your message regarding “{contact_data.subject}”.\n"
                f"Our team is reviewing it and will get back to you shortly.\n\n"
                f"– Skimpy Support Team"
            )
            
            auto_msg_doc = {
                "conversation_id": conversation_id,
                "sender_id": SKIMPY_SUPPORT_ID,
                "text": auto_reply_text,
                "created_at": datetime.utcnow(),
                "read_by": [user_id]  # Mark as read by user implicitly? Or maybe not. Let's send it.
            }
            messages.insert_one(auto_msg_doc)

            # 4. Update Conversation Last Text
            conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {
                    "last_text": "Support: Ticket Received", 
                    "updated_at": datetime.utcnow()
                }}
            )

            # 5. Trigger n8n Webhook in Background
            webhook_payload = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "user_name": contact_data.name,
                "user_email": contact_data.email,
                "subject": contact_data.subject,
                "category": contact_data.category,
                "message": contact_data.message,
                "full_text": full_text
            }
            background_tasks.add_task(trigger_n8n_webhook, webhook_payload)

            return {
                "message": "Support chat started",
                "mode": "chat",
                "conversation_id": conversation_id
            }

        # ---------------- GUEST: SAVE TO DB ----------------
        else:
            new_message = contact_data.dict()
            new_message["created_at"] = datetime.utcnow()
            new_message["status"] = "unread"
            
            result = contact_messages_collection.insert_one(new_message)
            
            return {
                "message": "Message received successfully",
                "mode": "ticket",
                "id": str(result.inserted_id)
            }

    except Exception as e:
        print(f"Error saving contact message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

import os
import httpx
from app.services.bot_handler import handle_bot_reply

async def trigger_n8n_webhook(payload: dict):
    """
    Sends data to n8n webhook.
    """
    url = os.getenv("N8N_SUPPORT_BOT_URL")
    if not url:
        print("N8N_SUPPORT_BOT_URL not set. Skipping webhook.")
        return

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=20.0) # Increased timeout for sync processing
            
            # check if successful response
            if response.status_code == 200:
                data = response.json()
                # Check if n8n returned a reply immediately (Sync)
                if "reply" in data:
                    await handle_bot_reply(payload["conversation_id"], data["reply"])
                    print("Processed synchronous n8n reply.")
            
        except Exception as e:
            print(f"Failed to trigger n8n webhook: {e}")