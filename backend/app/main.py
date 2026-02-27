import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.middleware.rbac_middleware import RBACMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.api.v1.routes import (
    auth,
    users,
    cart,
    wishlist,
    payments,
    orders,
    contact,
    chat,
    categories,
    products,
    vendors,
    variants,
    attributes,
    attribute_values,
    seller_routes,
    admin,
)

# Production: disable API docs
_docs = None if settings.is_production else "/docs"
_redoc = None if settings.is_production else "/redoc"
_openapi = None if settings.is_production else "/openapi.json"

app = FastAPI(
    docs_url=_docs,
    redoc_url=_redoc,
    openapi_url=_openapi,
)

# CORS: allow Vercel frontend and local dev
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://frontend:3000",
    "https://skimpy.vercel.app",
    "https://www.skimpy.vercel.app",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)
    origins.append(settings.FRONTEND_URL.replace("https://", "https://www."))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RBAC: global role-based access control (must run after CORS)
app.add_middleware(RBACMiddleware)
# Security headers
app.add_middleware(SecurityHeadersMiddleware)


@app.get("/", response_class=HTMLResponse)
def home():
    """Main landing page."""
    docs_link = '<a href="/docs" target="_blank">Go to API Docs</a>' if not settings.is_production else '<a href="/">Skimpy API</a>'
    html_content = f"""
    <html>
        <head><title>Skimpy API</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Welcome to the Skimpy API</h1>
            <p>Online Marketplace Backend</p>
            {docs_link}
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/health")
def health():
    """Health check for Render/monitoring. Returns 200 when API is up."""
    return {"status": "ok", "service": "skimpy-api"}


@app.get("/ping")
def ping():
    """Simple ping. Alias for /health."""
    return {"status": "ok"}


# ---------- API Routes (frontend-compatible paths) ----------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(payments.router)
app.include_router(orders.router)
app.include_router(contact.router)
app.include_router(chat.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(vendors.router)
app.include_router(variants.router)
app.include_router(attributes.router)
app.include_router(attribute_values.router)
app.include_router(seller_routes.router)
app.include_router(admin.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def startup_tasks():
    """Run once on deploy: email config check + cleanup expired OTPs."""
    gmail_ok = all(os.getenv(k) for k in ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_USER_EMAIL"])
    smtp_email = os.getenv("sender_email")
    smtp_pass = os.getenv("sender_password")
    if gmail_ok:
        logging.info("Email: using Gmail API transport (HTTPS).")
    elif smtp_email and smtp_pass:
        logging.info("Email: using SMTP transport (gmail.com:465).")
    else:
        logging.warning("Email: no valid transport. Set Gmail API or sender_email/sender_password.")
    from app.services.auth import _delete_expired_otps
    _delete_expired_otps()
