from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import stripe
import os
router = APIRouter(prefix="/payment", tags=["Payment"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
# :white_check_mark: Updated for multiple products + images + size
class CartItem(BaseModel):
    name: str
    price: float
    quantity: int
    image: str | None = None
    size: str | None = None
    product_id: str | None = None
    variant_id: str | None = None
@router.post("/create-checkout-session")
async def create_checkout_session(cart_items: List[CartItem]):
    try:
        line_items = []
        for item in cart_items:
            line_items.append(
                {
                    "price_data": {
                        "currency": "inr",
                        "unit_amount": int(item.price * 100),  # Rupees → Paise
                        "product_data": {
                            "name": f"{item.name}",
                            "images": [item.image] if item.image else [],
                            "metadata": {
                                "product_id": item.product_id,
                                "variant_id": item.variant_id,
                            },
                        },
                    },
                    "quantity": item.quantity,
                }
            )
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,
            success_url="http://localhost:5173/payment-success",
            cancel_url="http://localhost:5173/payment-cancel",
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print(":white_check_mark: Payment successful session:", session["id"])
        # TODO: Insert database update for Order here
    return {"status": "success"}