from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from ....db.mongodb import cate_db

router = APIRouter(prefix="/Chat", tags=["Chat"])


def oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")


def serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["id"] = str(doc.pop("_id"))
    # convert ObjectIds to str
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


@router.post("/start")
def start_conversation(buyer_id: str, vendor_user_id: str, product_id: Optional[str] = None):
    """Create or fetch a conversation between buyer and vendor user for optional product."""
    participants = sorted([buyer_id, vendor_user_id])
    query = {"participants": participants}
    if product_id:
        query["product_id"] = product_id

    existing = cate_db.conversations.find_one(query)
    if existing:
        return serialize(existing)

    doc = {
        "participants": participants,
        "product_id": product_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = cate_db.conversations.insert_one(doc)
    created = cate_db.conversations.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/conversations")
def list_conversations(user_id: str) -> List[dict]:
    convs = cate_db.conversations.find({"participants": {"$in": [user_id]}}).sort("updated_at", -1)
    return [serialize(c) for c in convs]


@router.get("/messages")
def get_messages(conversation_id: str) -> List[dict]:
    msgs = cate_db.messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    return [serialize(m) for m in msgs]


@router.post("/message")
def send_message(conversation_id: str, sender_id: str, text: str):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Message text required")

    # ensure conversation exists
    conv = cate_db.conversations.find_one({"_id": oid(conversation_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = {
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "text": text.strip(),
        "created_at": datetime.utcnow(),
        "read_by": [sender_id],
    }
    res = cate_db.messages.insert_one(msg)

    cate_db.conversations.update_one({"_id": conv["_id"]}, {"$set": {"updated_at": datetime.utcnow(), "last_text": msg["text"]}})

    created = cate_db.messages.find_one({"_id": res.inserted_id})
    return serialize(created)


