import os
import logging
from fastapi import FastAPI
from app.api.v1.routes import auth,users,categories,products,vendors,variants, attributes, attribute_values
from app.api.v1.routes import chat
from app.api.v1.routes import auth,users,categories,products,vendors,variants, attributes, attribute_values, seller_dashboard, cart, wishlist, payments, orders, contact
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://frontend:3000",
    "https://skimpy.vercel.app",
    "https://www.skimpy.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # allow all HTTP methods
    allow_headers=["*"],   # allow all headers
)



@app.get("/", response_class=HTMLResponse)
def home():
    """
    Main landing page. Provides a professional message and link to API docs.
    """
    html_content = """
    <html>
        <head>
            <title>Welcome to Skimpy API</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                a { text-decoration: none; color: #ffffff; background-color: #007BFF; padding: 10px 20px; border-radius: 5px; }
                a:hover { background-color: #0056b3; }
                h1 { color: #333333; }
                p { color: #555555; font-size: 18px; }
            </style>
        </head>
        <body>
            <h1>Welcome to the Skimpy API</h1>
            <p>Thank you for visiting! To explore the API endpoints and try them out, please click the button below to access the documentation.</p>
            <a href="/docs" target="_blank">Go to API Docs</a>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

app.include_router(auth.router) 
app.include_router(users.router) 
app.include_router(vendors.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(variants.router)
app.include_router(attributes.router)
app.include_router(attribute_values.router)
app.include_router(chat.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(payments.router)
app.include_router(orders.router)
app.include_router(contact.router)
app.include_router(seller_dashboard.router)



app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def check_email_config():
    """Log email config status so Render logs show any missing env vars."""
    smtp_email = os.getenv("sender_email")
    smtp_pass = os.getenv("sender_password")
    if not smtp_email or not smtp_pass:
        logging.warning(
            "Email: sender_email/sender_password not set. OTP, signup, login, and order emails will fail. "
            "Set both on Render Environment (Gmail App Password)."
        )



