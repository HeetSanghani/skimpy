from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from typing import Optional

from ....db.mongodb import cate_db, user_collection
from ....services.chat_manager import manager

from app.security.dependencies import get_current_user

router = APIRouter()

# Use synchronous collections from your pymongo setup
conversations = cate_db["conversations"]
messages = cate_db["messages"]
vendors = cate_db["vendors"]

SKIMPY_SUPPORT_ID = "skimpy_support_official"

def send_support_auto_reply(conversation_id: str):
    """
    Send a static auto-reply when user messages Skimpy Support.
    Support Bot (n8n) has been removed; users get an immediate acknowledgment.
    """
    reply_text = (
        "Thanks for reaching out! We've received your message. "
        "Our team will review it and get back to you shortly. – Skimpy Support"
    )
    try:
        msg_doc = {
            "conversation_id": conversation_id,
            "sender_id": SKIMPY_SUPPORT_ID,
            "text": reply_text,
            "created_at": datetime.utcnow(),
            "read_by": []
        }
        res = messages.insert_one(msg_doc)
        msg_id = str(res.inserted_id)

        conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"last_text": reply_text, "updated_at": datetime.utcnow()}}
        )

        conv = conversations.find_one({"_id": ObjectId(conversation_id)})
        if conv:
            for p in conv.get("participants", []):
                if str(p) != SKIMPY_SUPPORT_ID:
                    try:
                        final_msg = {
                            "id": msg_id,
                            "conversation_id": conversation_id,
                            "sender_id": SKIMPY_SUPPORT_ID,
                            "text": reply_text,
                            "created_at": msg_doc["created_at"].isoformat(),
                            "read_by": []
                        }
                        manager.send_personal_message_sync(
                            {"type": "message", "message": final_msg}, str(p)
                        )
                    except Exception:
                        pass
    except Exception as e:
        print(f"Support auto-reply failed: {e}")

# ---------------- REST Endpoints ----------------

@router.post("/Chat/start")
def start_conversation(
    buyer_id: str = Query(...),
    vendor_user_id: str = Query(...),
    product_id: Optional[str] = Query(None),
):
    """Create or return a 1:1 conversation between buyer and vendor."""
    # START PROFILE CHECK
    user_doc = user_collection.find_one({"user_id": buyer_id})
    if user_doc:
         required_fields = ["phone", "DOB", "gender", "avatar"]
         missing = [f for f in required_fields if not user_doc.get(f)]
         if missing:
             raise HTTPException(status_code=403, detail=f"Incomplete profile. Missing: {', '.join(missing)}")
    # END PROFILE CHECK (If user not found, logic below might handle or error, but this gate is for known users)
    
    resolved_vendor_user_id = vendor_user_id
    resolved_vendor_id = None

    # Attempt to resolve vendor_user_id when a vendor document id is passed
    vendor_doc = None
    try:
        vendor_obj_id = ObjectId(vendor_user_id)
        vendor_doc = vendors.find_one({"_id": vendor_obj_id})
    except (InvalidId, TypeError):
        vendor_doc = vendors.find_one({"user_id": vendor_user_id})
    if vendor_doc:
        resolved_vendor_id = str(vendor_doc["_id"])
        if vendor_doc.get("user_id"):
            resolved_vendor_user_id = str(vendor_doc["user_id"])

    search_variants = []
    # Current (canonical) form
    search_variants.append({
        "participants": {"$all": [buyer_id, resolved_vendor_user_id]},
        "product_id": product_id,
    })
    # Backwards compatibility: conversations that stored vendor document _id instead of user id
    if resolved_vendor_id:
        search_variants.append({
            "participants": {"$all": [buyer_id, resolved_vendor_id]},
            "product_id": product_id,
        })

    existing = conversations.find_one({"$or": search_variants})

    if existing:
        update_fields = {}
        # Normalize stored participants for legacy conversations
        participants = {str(pid) for pid in existing.get("participants", [])}
        if resolved_vendor_user_id and resolved_vendor_user_id not in participants:
            participants.add(resolved_vendor_user_id)
            update_fields["participants"] = list(participants)
        if resolved_vendor_id and existing.get("vendor_id") != resolved_vendor_id:
            update_fields["vendor_id"] = resolved_vendor_id
        if resolved_vendor_user_id and existing.get("vendor_user_id") != resolved_vendor_user_id:
            update_fields["vendor_user_id"] = resolved_vendor_user_id
        if update_fields:
            conversations.update_one(
                {"_id": existing["_id"]},
                {"$set": update_fields},
            )
            existing.update(update_fields)
        return {
            "id": str(existing["_id"]),
            "participants": existing.get("participants", []),
            "vendor_id": existing.get("vendor_id"),
            "vendor_user_id": existing.get("vendor_user_id"),
        }

    new_conv = {
        "participants": list({buyer_id, resolved_vendor_user_id}),
        "product_id": product_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_text": "",
        "vendor_id": resolved_vendor_id,
        "vendor_user_id": resolved_vendor_user_id,
    }
    res = conversations.insert_one(new_conv)
    return {
        "id": str(res.inserted_id),
        "participants": new_conv["participants"],
        "vendor_id": new_conv.get("vendor_id"),
        "vendor_user_id": new_conv.get("vendor_user_id"),
    }


@router.get("/Chat/messages")
def get_messages(
    conversation_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user.get("user_id"))
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated user")

    conv = conversations.find_one({"_id": ObjectId(conversation_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user_id not in [str(pid) for pid in conv.get("participants", [])]:
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")

    mark_messages_as_read(conversation_id, user_id)

    cursor = messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    result = []
    for m in cursor:
        result.append({
            "id": str(m["_id"]),
            "conversation_id": m["conversation_id"],
            "sender_id": m["sender_id"],
            "text": m["text"],
            "created_at": m["created_at"].isoformat() if isinstance(m["created_at"], datetime) else str(m["created_at"]),
            "read_by": m.get("read_by", []),
        })

    return result


def resolve_display_info(participant_id: str):
    """Resolve participant metadata (name/avatar/type)."""
    if not participant_id:
        return {
            "display_name": "Conversation",
            "avatar": None,
            "is_seller": False,
            "user_id": "",
            "vendor_id": None,
        }

    if participant_id == SKIMPY_SUPPORT_ID:
        return {
            "display_name": "Skimpy Support",
            "avatar": "https://cdn-icons-png.flaticon.com/512/4712/4712035.png", # Professional support icon
            "is_seller": False,
            "user_id": SKIMPY_SUPPORT_ID,
            "vendor_id": None,
            "is_support": True
        }

    # Try to resolve via vendor (seller) profile first
    vendor_doc = vendors.find_one({"user_id": participant_id})
    if not vendor_doc:
        try:
            vendor_doc = vendors.find_one({"_id": ObjectId(participant_id)})
        except (InvalidId, TypeError):
            vendor_doc = None

    if vendor_doc:
        return {
            "display_name": vendor_doc.get("shop_name")
            or vendor_doc.get("store_name")
            or participant_id,
            "avatar": vendor_doc.get("image"),
            "is_seller": True,
            "user_id": vendor_doc.get("user_id") or participant_id,
            "vendor_id": str(vendor_doc.get("_id")),
        }

    # Fallback to user profile
    user_doc = user_collection.find_one({"user_id": participant_id})
    if not user_doc:
        try:
            user_doc = user_collection.find_one({"_id": ObjectId(participant_id)})
        except (InvalidId, TypeError):
            user_doc = None

    if user_doc:
        first = user_doc.get("first_name") or ""
        last = user_doc.get("last_name") or ""
        full_name = f"{first} {last}".strip()
        display_name = (
            user_doc.get("shop_name")
            or user_doc.get("store_name")
            or full_name
            or user_doc.get("username")
            or user_doc.get("email")
            or participant_id
        )
        return {
            "display_name": display_name,
            "avatar": user_doc.get("avatar") or user_doc.get("profile_image"),
            "is_seller": bool(user_doc.get("shop_name") or user_doc.get("store_name")),
            "user_id": user_doc.get("user_id") or participant_id,
            "vendor_id": None,
        }

    return {
        "display_name": participant_id,
        "avatar": None,
        "is_seller": False,
        "user_id": participant_id,
        "vendor_id": None,
    }


def compute_unread_count(conv_id: str, user_id: str) -> int:
    return messages.count_documents(
        {
            "conversation_id": conv_id,
            "sender_id": {"$ne": user_id},
            "$or": [
                {"read_by": {"$exists": False}},
                {"read_by": {"$eq": []}},
                {"read_by": {"$ne": user_id}},
                {"read_by": {"$nin": [user_id]}},
            ],
        }
    )


def mark_messages_as_read(conv_id: str, user_id: str):
    messages.update_many(
        {
            "conversation_id": conv_id,
            "sender_id": {"$ne": user_id},
            "$or": [
                {"read_by": {"$exists": False}},
                {"read_by": {"$eq": []}},
                {"read_by": {"$nin": [user_id]}},
            ],
        },
        {"$addToSet": {"read_by": user_id}},
    )


@router.get("/Chat/unread")
def get_unread_counts(current_user: dict = Depends(get_current_user)):
    """Return unread counts per conversation and total for a user."""
    user_id = str(current_user.get("user_id"))
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated user")

    cursor = conversations.find({"participants": user_id})
    per_conversation = {}
    total = 0
    for conv in cursor:
        conv_id = str(conv["_id"])
        count = compute_unread_count(conv_id, user_id)
        per_conversation[conv_id] = count
        total += count

    return {"total_unread": total, "conversations": per_conversation}


@router.get("/Chat/conversations")
def list_conversations(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    """Return recent conversations for the authenticated user."""
    user_id = str(current_user.get("user_id"))
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated user")

    cursor = conversations.find({"participants": user_id}).sort("updated_at", -1).limit(limit)
    results = []
    for conv in cursor:
        conv_id = str(conv["_id"])
        participant_ids = [str(pid) for pid in conv.get("participants", [])]
        other_participants = [pid for pid in participant_ids if pid != user_id]

        peer_id = other_participants[0] if other_participants else ""

        display_info = resolve_display_info(peer_id)
        vendor_info = None
        if display_info.get("is_seller"):
            vendor_info = {
                "vendor_id": display_info.get("vendor_id"),
                "user_id": display_info.get("user_id") or peer_id,
                "shop_name": display_info.get("display_name"),
                "avatar": display_info.get("avatar"),
            }

        last_message_doc = messages.find({"conversation_id": conv_id}).sort("created_at", -1).limit(1)
        last_message = None
        for msg in last_message_doc:
            created = msg.get("created_at")
            last_message = {
                "id": str(msg.get("_id", "")),
                "sender_id": str(msg.get("sender_id", "")),
                "text": msg.get("text", ""),
                "created_at": created.isoformat() if isinstance(created, datetime) else str(created),
            }
            break

        unread_count = compute_unread_count(conv_id, user_id)

        updated_at = conv.get("updated_at")
        results.append(
            {
                "id": conv_id,
                "participants": participant_ids,
                "other_participants": other_participants,
                "last_text": conv.get("last_text", last_message["text"] if last_message else ""),
                "updated_at": updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at),
                "last_message": last_message,
                "unread_count": unread_count,
                "metadata": {
                    "product_id": conv.get("product_id"),
                    "vendor": vendor_info,
                    "peer": {
                        "display_name": display_info.get("display_name"),
                        "avatar": display_info.get("avatar"),
                        "is_seller": display_info.get("is_seller", False),
                        "user_id": display_info.get("user_id") or peer_id,
                    },
                },
            }
        )

    return results


# @router.post("/Chat/message")
# def post_message(conversation_id: str = Query(...), sender_id: str = Query(...), text: str = Query(...)):
#     text = text.strip()
#     if not text:
#         raise HTTPException(status_code=400, detail="Empty message")

#     conv = conversations.find_one({"_id": ObjectId(conversation_id)})
#     if not conv:
#         raise HTTPException(status_code=404, detail="Conversation not found")

#     msg_doc = {
#         "conversation_id": conversation_id,
#         "sender_id": sender_id,
#         "text": text,
#         "created_at": datetime.utcnow(),
#         "read_by": [sender_id]
#     }
#     messages.insert_one(msg_doc)

#     # update last_text
#     conversations.update_one(
#         {"_id": ObjectId(conversation_id)},
#         {"$set": {"last_text": text, "updated_at": datetime.utcnow()}}
#     )

#     # notify all except sender
#     for p in conv["participants"]:
#         if p != sender_id:
#             try:
#                 manager.send_personal_message_sync(
#                     {"type": "message", "message": msg_doc}, p
#                 )
#             except Exception:
#                 pass

#     return {"status": "sent", "message": msg_doc}


@router.post("/Chat/message")
def post_message(
    conversation_id: str = Query(...),
    text: str = Query(...),
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Send a chat message — works with PyMongo (not async)."""
    sender_id = str(current_user.get("user_id"))
    if not sender_id:
        raise HTTPException(status_code=401, detail="Unauthenticated user")

    # START PROFILE CHECK
    user_doc = user_collection.find_one({"user_id": sender_id})
    if user_doc:
         required_fields = ["phone", "DOB", "gender", "avatar"]
         missing = [f for f in required_fields if not user_doc.get(f)]
         if missing:
             raise HTTPException(status_code=403, detail=f"Incomplete profile. Missing: {', '.join(missing)}")
    # END PROFILE CHECK

    text = text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    try:
        conv = conversations.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        conv = None

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_doc = {
        "conversation_id": conversation_id,  # keep as string for simplicity
        "sender_id": sender_id,
        "text": text,
        "created_at": datetime.utcnow(),
        "read_by": [sender_id],
    }

    insert_result = messages.insert_one(msg_doc)
    inserted_id = str(insert_result.inserted_id)

    # ✅ Update conversation summary
    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"last_text": text, "updated_at": datetime.utcnow()}},
    )
    
    # Send static auto-reply when messaging Skimpy Support (n8n Support Bot removed)
    if SKIMPY_SUPPORT_ID in [str(p) for p in conv.get("participants", [])] and sender_id != SKIMPY_SUPPORT_ID:
        if background_tasks:
            background_tasks.add_task(send_support_auto_reply, conversation_id)

    # ✅ Return normalized response
    return {
        "status": "sent",
        "message": {
            "id": inserted_id,
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "text": text,
            "created_at": msg_doc["created_at"].isoformat(),
        },
    }

# ---------------- WebSocket ----------------

@router.websocket("/ws/chat/{user_id}")
async def chat_socket(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            conv_id = data.get("conversation_id")
            sender_id = data.get("sender_id")
            text = data.get("text", "").strip()
            if not text or not conv_id:
                continue

            msg_doc = {
                "conversation_id": conv_id,
                "sender_id": sender_id,
                "text": text,
                "created_at": datetime.utcnow(),
                "read_by": [sender_id]
            }
            messages.insert_one(msg_doc)

            conversations.update_one(
                {"_id": ObjectId(conv_id)},
                {"$set": {"last_text": text, "updated_at": datetime.utcnow()}}
            )

            conv = conversations.find_one({"_id": ObjectId(conv_id)})
            if conv:
                for p in conv["participants"]:
                    await manager.send_personal_message(
                        {"type": "message", "message": msg_doc}, p
                    )
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
