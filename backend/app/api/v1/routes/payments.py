from fastapi import APIRouter, HTTPException
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import stripe
import os

router = APIRouter(prefix="/payment", tags=["Payment"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class CheckoutRequest(BaseModel):
    product_name: str
    amount: int
    product_id: str | None = None
    variant_id: str | None = None



@router.post("/create-checkout-session")
async def create_checkout_session(data: CheckoutRequest):
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='payment',
            line_items=[
                {
                    "price_data": {
                        "currency": "inr",
                        "unit_amount": data.amount,
                        "product_data": {
                            "name": data.product_name,
                        },
                    },
                    "quantity": 1,
                },
            ],
            metadata={
                "product_id": data.product_id,
                "variant_id": data.variant_id or "none",
            },
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
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )

    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    # Handle successful payment event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print("✅ Payment successful session:", session["id"])

        # TODO: update order status in database here

    return {"status": "success"}
