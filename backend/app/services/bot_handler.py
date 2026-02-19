
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import cate_db
from app.services.chat_manager import manager
from app.api.v1.routes.chat import SKIMPY_SUPPORT_ID

# Collections
messages = cate_db["messages"]
conversations = cate_db["conversations"]

async def handle_bot_reply(conversation_id: str, text: str):
    """
    Saves the bot's reply to the database and notifies the user via WebSocket.
    """
    
    # 1. Insert Message
    msg_doc = {
        "conversation_id": conversation_id,
        "sender_id": SKIMPY_SUPPORT_ID,
        "text": text,
        "created_at": datetime.utcnow(),
        "read_by": []
    }
    
    res = messages.insert_one(msg_doc)
    msg_id = str(res.inserted_id)

    # 2. Update Conversation
    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {
            "last_text": text,
            "updated_at": datetime.utcnow()
        }}
    )

    # 3. Notify User via WebSocket
    # We need to find the other participant (the user)
    conv = conversations.find_one({"_id": ObjectId(conversation_id)})
    if conv:
        participant_ids = conv.get("participants", [])
        for p in participant_ids:
            if str(p) != SKIMPY_SUPPORT_ID:
                # Prepare message for WebSocket
                final_msg = {
                    "id": msg_id,
                    "conversation_id": conversation_id,
                    "sender_id": SKIMPY_SUPPORT_ID,
                    "text": text,
                    "created_at": msg_doc["created_at"].isoformat(),
                    "read_by": []
                }
                
                await manager.send_personal_message(
                    {"type": "message", "message": final_msg}, str(p)
                )

    return {"status": "success", "message_id": msg_id}
