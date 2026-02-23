"""
Skimpy Email Service — sends all transactional emails.

Replaces n8n webhooks for: OTP, signup, login, OTP verified, order invoice.

Transport priority:
1. Gmail API over HTTPS (preferred in hosted environments like Render)
2. SMTP (Gmail) as a fallback when network allows direct SMTP
"""
import base64
import json
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://skimpy.vercel.app")


def _gmail_api_enabled() -> bool:
    """Return True when all Gmail API env vars are present."""
    required = [
        "GMAIL_CLIENT_ID",
        "GMAIL_CLIENT_SECRET",
        "GMAIL_REFRESH_TOKEN",
        "GMAIL_USER_EMAIL",
    ]
    return all(os.getenv(k) for k in required)


def _get_gmail_access_token() -> str:
    """
    Exchange a long‑lived refresh token for a short‑lived access token.

    This uses the standard Google OAuth2 token endpoint and does not require
    any interactive flow at runtime.
    """
    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")

    if not (client_id and client_secret and refresh_token):
        raise ValueError("Gmail API not configured: missing client id/secret or refresh token")

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    resp = requests.post(token_url, data=data, timeout=15)
    try:
        resp.raise_for_status()
    except Exception:
        logger.error("Gmail token refresh failed: %s - %s", resp.status_code, resp.text)
        raise

    payload = resp.json()
    access_token = payload.get("access_token")
    if not access_token:
        raise ValueError("Gmail token response missing access_token")
    return access_token


def _send_via_gmail_api(to_email: str, subject: str, html_body: str):
    """
    Send HTML email using Gmail API over HTTPS.

    This avoids direct SMTP connections (which are often blocked on PaaS
    free tiers) while keeping all existing templates intact.
    """
    user_email = os.getenv("GMAIL_USER_EMAIL")
    if not user_email:
        raise ValueError("GMAIL_USER_EMAIL not set")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = user_email
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    access_token = _get_gmail_access_token()

    send_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    resp = requests.post(
        send_url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json={"raw": raw},
        timeout=15,
    )
    try:
        resp.raise_for_status()
    except Exception:
        logger.error("Gmail API send failed: %s - %s", resp.status_code, resp.text)
        raise


def _get_smtp():
    sender = os.getenv("sender_email")
    password = os.getenv("sender_password")
    if not sender or not password:
        raise ValueError("SMTP not configured: set sender_email and sender_password in environment")
    return sender, password


def _send_via_smtp(to_email: str, subject: str, html_body: str):
    """Fallback SMTP sender (used when Gmail API is not configured)."""
    sender, password = _get_smtp()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
        server.login(sender, password)
        server.sendmail(sender, to_email, msg.as_string())


def _send_html(to_email: str, subject: str, html_body: str):
    """
    Send HTML email using the best available transport.

    1. If Gmail API env vars are present → use Gmail API over HTTPS.
    2. Otherwise fall back to SMTP (if configured).
    """
    if _gmail_api_enabled():
        _send_via_gmail_api(to_email, subject, html_body)
        return

    # Fallback to SMTP (works only when environment allows direct SMTP).
    _send_via_smtp(to_email, subject, html_body)


# ─── TEMPLATE HELPERS ─────────────────────────────────────────────────────
_BASE_STYLE = """
background-color:#0a0a0a;color:#e5e7eb;font-family:sans-serif;padding:40px;
"""
_CARD_STYLE = """
max-width:600px;margin:auto;background:#1a1a1a;border-radius:16px;border:1px solid #333;overflow:hidden;
"""
_HEADER_STYLE = """
background:linear-gradient(90deg,#4f46e5,#9333ea);padding:30px;text-align:center;
"""
_BTN_STYLE = """
display:inline-block;background:#4f46e5;color:white;padding:12px 28px;border-radius:8px;
text-decoration:none;font-weight:bold;margin-top:20px;
"""


def send_otp_email(to_email: str, otp: str):
    """Send OTP for registration/forgot password."""
    html = f"""
<div style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <div style="{_HEADER_STYLE}"><h1 style="color:white;margin:0;letter-spacing:2px;">SKIMPY</h1></div>
    <div style="padding:40px;text-align:center;">
      <h2 style="color:white;margin-top:0;">Verify Your Account</h2>
      <p style="color:#a1a1aa;">Use the code below to complete your verification.</p>
      <div style="background:#2d2d2d;color:#4f46e5;font-size:32px;font-weight:bold;letter-spacing:8px;
        padding:24px;border-radius:8px;margin:30px 0;border:1px dashed #4f46e5;">{otp}</div>
      <p style="color:#666;font-size:12px;">Expires in 5 minutes.</p>
    </div>
  </div>
</div>
"""
    _send_html(to_email, "Your Skimpy OTP Code", html)


def send_signup_welcome_email(user_data: dict):
    """Send welcome email after registration."""
    try:
        _send_signup_welcome_email(user_data)
    except Exception as e:
        logger.exception("Failed to send signup welcome email: %s", e)


def _send_signup_welcome_email(user_data: dict):
    first_name = user_data.get("first_name", "").strip() or "there"
    html = f"""
<div style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <div style="{_HEADER_STYLE}"><h1 style="color:white;margin:0;letter-spacing:2px;">SKIMPY</h1></div>
    <div style="padding:40px;text-align:center;">
      <h2 style="color:white;margin-top:0;">Welcome, {first_name}!</h2>
      <p style="color:#a1a1aa;">Thanks for joining Skimpy! We're excited to have you on board.</p>
      <a href="{FRONTEND_URL}" style="{_BTN_STYLE}">Start Exploring</a>
    </div>
  </div>
</div>
"""
    to_email = user_data.get("email", "").strip()
    if to_email:
        _send_html(to_email, "Welcome to Skimpy! 🎉", html)


def send_login_alert_email(user_data: dict):
    """Send login success notification."""
    try:
        _send_login_alert_email(user_data)
    except Exception as e:
        logger.exception("Failed to send login alert email: %s", e)


def _send_login_alert_email(user_data: dict):
    first_name = user_data.get("first_name", "").strip() or "User"
    ip = user_data.get("ip", "—")
    device = user_data.get("device", "—")
    login_time = user_data.get("login_time", "—")
    html = f"""
<div style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <div style="{_HEADER_STYLE}"><h1 style="color:white;margin:0;letter-spacing:2px;">SKIMPY</h1></div>
    <div style="padding:40px;">
      <h2 style="color:white;margin-top:0;">New Login Detected</h2>
      <p style="color:#a1a1aa;">Hi {first_name}, a new login was detected.</p>
      <table style="width:100%;color:#d1d5db;margin-top:20px;border-collapse:collapse;">
        <tr><td style="padding:10px;border-bottom:1px solid #333;">IP Address</td>
            <td style="padding:10px;border-bottom:1px solid #333;text-align:right;">{ip}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #333;">Device</td>
            <td style="padding:10px;border-bottom:1px solid #333;text-align:right;">{device}</td></tr>
        <tr><td style="padding:10px;">Time</td>
            <td style="padding:10px;text-align:right;">{login_time}</td></tr>
      </table>
    </div>
  </div>
</div>
"""
    to_email = user_data.get("email", "").strip()
    if to_email:
        _send_html(to_email, "New Login to Your Skimpy Account", html)


def send_otp_verified_email(to_email: str):
    """Send confirmation after OTP verified."""
    try:
        _send_otp_verified_email(to_email)
    except Exception as e:
        logger.exception("Failed to send OTP verified email: %s", e)


def _send_otp_verified_email(to_email: str):
    html = f"""
<div style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <div style="{_HEADER_STYLE}"><h1 style="color:white;margin:0;letter-spacing:2px;">SKIMPY</h1></div>
    <div style="padding:40px;text-align:center;">
      <h2 style="color:#10b981;margin-top:0;">Account Verified! ✅</h2>
      <p style="color:#a1a1aa;">Your account is fully active. Happy Shopping!</p>
      <a href="{FRONTEND_URL}" style="{_BTN_STYLE}">Go to Shop</a>
    </div>
  </div>
</div>
"""
    _send_html(to_email, "✅ Account Verified — Welcome to Skimpy!", html)


def send_order_invoice_email(user_data: dict, order_summary: dict):
    """Send order confirmation with invoice."""
    try:
        _send_order_invoice_email(user_data, order_summary)
    except Exception as e:
        logger.exception("Failed to send order invoice email: %s", e)


def _send_order_invoice_email(user_data: dict, order_summary: dict):
    email = user_data.get("email", "").strip()
    if not email:
        return

    order_ids = order_summary.get("order_ids", [])
    order_id_str = ", #".join(str(x) for x in order_ids) if order_ids else "—"
    products = order_summary.get("products", [])
    total = order_summary.get("total_amount", 0)
    shipping = order_summary.get("shipping_address", {})
    addr1 = shipping.get("address_line1", "")
    city = shipping.get("city", "")
    state = shipping.get("state", "")

    rows = ""
    for p in products:
        name = p.get("name", "Item")
        qty = p.get("quantity", 1)
        price = p.get("price", 0)
        seller = p.get("seller_name", "")
        rows += f"""
<tr style="border-bottom:1px solid #333;">
  <td style="padding:10px;">
    <div style="font-weight:bold;color:white;">{name}</div>
    <div style="font-size:12px;color:#888;">{seller}</div>
  </td>
  <td style="padding:10px;text-align:center;">{qty}</td>
  <td style="padding:10px;text-align:right;">₹{price}</td>
</tr>
"""

    html = f"""
<div style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <div style="{_HEADER_STYLE}"><h1 style="color:white;margin:0;letter-spacing:2px;">SKIMPY</h1></div>
    <div style="padding:40px;">
      <h2 style="color:white;margin-top:0;">Order Confirmed!</h2>
      <p style="color:#a1a1aa;">Order #{order_id_str}</p>
      <table style="width:100%;margin:30px 0;border-collapse:collapse;color:#e5e7eb;">
        <thead><tr style="border-bottom:2px solid #333;">
          <th style="padding:10px;text-align:left;">Item</th>
          <th style="padding:10px;text-align:center;">Qty</th>
          <th style="padding:10px;text-align:right;">Price</th>
        </tr></thead>
        <tbody>{rows}</tbody>
        <tfoot><tr>
          <td colspan="2" style="padding:15px;text-align:right;font-weight:bold;">Total</td>
          <td style="padding:15px;text-align:right;font-weight:bold;color:#4f46e5;font-size:18px;">₹{total}</td>
        </tr></tfoot>
      </table>
      <div style="background:#222;padding:20px;border-radius:8px;">
        <h3 style="color:white;margin:0 0 10px 0;font-size:16px;">Shipping Address</h3>
        <p style="color:#aaa;margin:0;line-height:1.5;">{addr1}<br>{city}, {state}</p>
      </div>
    </div>
  </div>
</div>
"""
    first_id = order_ids[0] if order_ids else "Order"
    _send_html(email, f"Order Confirmed — #{first_id}", html)
