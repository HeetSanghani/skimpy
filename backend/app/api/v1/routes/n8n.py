from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import os

from ....db.mongodb import cate_db
from ....services.chat_manager import manager
from .chat import SKIMPY_SUPPORT_ID

router = APIRouter(prefix="/n8n", tags=["n8n Automation"])

messages = cate_db["messages"]
conversations = cate_db["conversations"]

class N8nReply(BaseModel):
    conversation_id: str
    text: str

@router.post("/reply")
async def n8n_reply(
    reply_data: N8nReply,
    x_api_secret: str = Header(None, alias="X-API-SECRET")
):
    """
    Callback endpoint for n8n to send the AI-generated reply back to Skimpy.
    """
    # 1. Verify Secret
    expected_secret = os.getenv("SKIMPY_API_SECRET")
    if not expected_secret or x_api_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid API Secret")

    # 2. Insert Message
    msg_doc = {
        "conversation_id": reply_data.conversation_id,
        "sender_id": SKIMPY_SUPPORT_ID,
        "text": reply_data.text,
        "created_at": datetime.utcnow(),
        "read_by": []  
    }
    
    res = messages.insert_one(msg_doc)
    msg_id = str(res.inserted_id)

    # 3. Update Conversation
    conversations.update_one(
        {"_id": ObjectId(reply_data.conversation_id)},
        {"$set": {
            "last_text": reply_data.text,
            "updated_at": datetime.utcnow()
        }}
    )

    # 4. Notify User via WebSocket
    # We need to find the other participant (the user)
    conv = conversations.find_one({"_id": ObjectId(reply_data.conversation_id)})
    if conv:
        participant_ids = conv.get("participants", [])
        for p in participant_ids:
            if str(p) != SKIMPY_SUPPORT_ID:
                # Prepare message for WebSocket (must be JSON serializable)
                # Converting ObjectId and datetime to strings
                final_msg = {
                    "id": msg_id,
                    "conversation_id": reply_data.conversation_id,
                    "sender_id": SKIMPY_SUPPORT_ID,
                    "text": reply_data.text,
                    "created_at": msg_doc["created_at"].isoformat(),
                    "read_by": []
                }
                
                await manager.send_personal_message(
                    {"type": "message", "message": final_msg}, str(p)
                )

    return {"status": "success", "message_id": msg_id}
