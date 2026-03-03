"""
Skimpy Email Service — sends all transactional emails.

Replaces n8n webhooks for: OTP, signup, login, OTP verified, order invoice.

Transport priority:
1. Gmail API over HTTPS (preferred in hosted environments like Render)
2. SMTP (Gmail) as a fallback when network allows direct SMTP
"""
import base64
import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://skimpy.vercel.app")

# ─── Brand Colours (Skimpy palette) ───────────────────────────────────────────
_BRAND_GRADIENT = "background:linear-gradient(135deg,#4f46e5 0%,#9333ea 100%);"
_BRAND_PRIMARY  = "#4f46e5"
_BRAND_PURPLE   = "#9333ea"
_TEXT_DARK      = "#1a1a2e"
_TEXT_BODY      = "#374151"
_TEXT_MUTED     = "#6b7280"
_BG_PAGE        = "#f3f4f6"
_BG_CARD        = "#ffffff"
_BG_SUBTLE      = "#f9fafb"
_BORDER_COLOR   = "#e5e7eb"


def _gmail_api_enabled() -> bool:
    required = [
        "GMAIL_CLIENT_ID",
        "GMAIL_CLIENT_SECRET",
        "GMAIL_REFRESH_TOKEN",
        "GMAIL_USER_EMAIL",
    ]
    return all(os.getenv(k) for k in required)


def _get_gmail_access_token() -> str:
    client_id     = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")

    if not (client_id and client_secret and refresh_token):
        raise ValueError("Gmail API not configured: missing client id/secret or refresh token")

    resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id":     client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type":    "refresh_token",
        },
        timeout=15,
    )
    try:
        resp.raise_for_status()
    except Exception:
        logger.error("Gmail token refresh failed: %s - %s", resp.status_code, resp.text)
        raise

    access_token = resp.json().get("access_token")
    if not access_token:
        raise ValueError("Gmail token response missing access_token")
    return access_token


def _send_via_gmail_api(to_email: str, subject: str, html_body: str):
    user_email = os.getenv("GMAIL_USER_EMAIL")
    if not user_email:
        raise ValueError("GMAIL_USER_EMAIL not set")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Skimpy Marketplace <{user_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    access_token = _get_gmail_access_token()

    resp = requests.post(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
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
    sender   = os.getenv("sender_email")
    password = os.getenv("sender_password")
    if not sender or not password:
        raise ValueError("SMTP not configured: set sender_email and sender_password")
    return sender, password


def _send_via_smtp(to_email: str, subject: str, html_body: str):
    sender, password = _get_smtp()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Skimpy Marketplace <{sender}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
        server.login(sender, password)
        server.sendmail(sender, to_email, msg.as_string())


def _send_html(to_email: str, subject: str, html_body: str):
    if _gmail_api_enabled():
        _send_via_gmail_api(to_email, subject, html_body)
        return
    _send_via_smtp(to_email, subject, html_body)


# ─── SHARED LAYOUT WRAPPERS ───────────────────────────────────────────────────

def _email_wrapper(content_html: str) -> str:
    """
    Production-grade email shell.
    - Table-based layout (Gmail/Outlook/Apple Mail safe)
    - Inline CSS only
    - 600px max-width with mobile padding fallback
    - Light background — readable in both light and dark mode
    """
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Skimpy</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width:620px){{
      .email-wrapper {{width:100%!important;padding:10px!important;}}
      .email-card {{border-radius:12px!important;}}
      .email-header {{padding:24px 20px!important;}}
      .email-body {{padding:24px 20px!important;}}
      .btn-cta {{padding:14px 28px!important;font-size:15px!important;}}
      .product-table {{font-size:13px!important;}}
      .product-table td {{padding:8px 6px!important;}}
      .two-col td {{display:block!important;width:100%!important;box-sizing:border-box;}}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:{_BG_PAGE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Pre-header (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Skimpy Marketplace — The best thrifted &amp; handcrafted goods.&nbsp;&zwnj;&zwj;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
         style="background-color:{_BG_PAGE};padding:32px 16px;" class="email-wrapper">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
               style="max-width:600px;background-color:{_BG_CARD};border-radius:16px;
                      border:1px solid {_BORDER_COLOR};overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.06);" class="email-card">

          <!-- HEADER -->
          <tr>
            <td style="{_BRAND_GRADIENT}padding:28px 40px;text-align:center;" class="email-header">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:rgba(255,255,255,0.15);
                                border-radius:12px;padding:8px 20px;margin-bottom:4px;">
                      <span style="color:#ffffff;font-size:22px;font-weight:900;
                                   letter-spacing:3px;text-decoration:none;">SKIMPY</span>
                    </div>
                    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:6px 0 0 0;
                               letter-spacing:1px;">Thrifted &amp; Handcrafted Marketplace</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding:36px 40px;" class="email-body">
              {content_html}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:{_BORDER_COLOR};"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="color:{_TEXT_MUTED};font-size:12px;margin:0 0 8px 0;line-height:1.6;">
                Questions? <a href="mailto:support@skimpy.com" style="color:{_BRAND_PRIMARY};text-decoration:none;">support@skimpy.com</a>
              </p>
              <p style="color:{_TEXT_MUTED};font-size:12px;margin:0 0 12px 0;line-height:1.6;">
                <a href="{FRONTEND_URL}" style="color:{_BRAND_PRIMARY};text-decoration:none;">skimpy.vercel.app</a>
                &nbsp;·&nbsp;
                <a href="{FRONTEND_URL}/contact" style="color:{_TEXT_MUTED};text-decoration:none;">Contact Us</a>
              </p>
              <p style="color:#9ca3af;font-size:11px;margin:0;">
                &copy; {year} Skimpy Marketplace. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->
      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>"""


def _cta_button(href: str, label: str) -> str:
    return (
        f'<table role="presentation" border="0" cellpadding="0" cellspacing="0" '
        f'style="margin:24px auto 0 auto;">'
        f'<tr><td align="center" style="{_BRAND_GRADIENT}border-radius:10px;">'
        f'<a href="{href}" class="btn-cta" target="_blank" '
        f'style="display:inline-block;color:#ffffff;font-size:15px;font-weight:700;'
        f'text-decoration:none;padding:14px 36px;border-radius:10px;'
        f'mso-padding-alt:14px 36px;">{label}</a>'
        f'</td></tr></table>'
    )


# ─── OTP EMAIL ────────────────────────────────────────────────────────────────

def send_otp_email(to_email: str, otp: str):
    """Send OTP for registration/forgot password."""
    content = f"""
    <h2 style="color:{_TEXT_DARK};margin:0 0 8px 0;font-size:24px;font-weight:800;text-align:center;">
      Verify Your Account
    </h2>
    <p style="color:{_TEXT_MUTED};text-align:center;margin:0 0 32px 0;font-size:15px;line-height:1.6;">
      Use the one-time code below to complete your verification. It expires in <strong>5 minutes</strong>.
    </p>

    <!-- OTP Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="margin:0 0 32px 0;">
      <tr>
        <td align="center">
          <div style="background:{_BG_SUBTLE};border:2px dashed {_BRAND_PRIMARY};
                      border-radius:12px;padding:24px 32px;display:inline-block;">
            <span style="color:{_BRAND_PRIMARY};font-size:40px;font-weight:900;
                         letter-spacing:12px;font-family:monospace;">{otp}</span>
          </div>
        </td>
      </tr>
    </table>

    <p style="color:{_TEXT_MUTED};font-size:13px;text-align:center;margin:0;line-height:1.6;">
      ⚠️ Never share this code with anyone. Skimpy will never ask for your OTP.
    </p>
    """
    _send_html(to_email, "🔐 Your Skimpy Verification Code", _email_wrapper(content))


# ─── WELCOME EMAIL ────────────────────────────────────────────────────────────

def send_signup_welcome_email(user_data: dict):
    try:
        _send_signup_welcome_email(user_data)
    except Exception as e:
        logger.exception("Failed to send signup welcome email: %s", e)


def _send_signup_welcome_email(user_data: dict):
    first_name = user_data.get("first_name", "").strip() or "there"
    to_email   = user_data.get("email", "").strip()
    if not to_email:
        return

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h2 style="color:{_TEXT_DARK};margin:0 0 8px 0;font-size:26px;font-weight:800;">
        Welcome to Skimpy, {first_name}!
      </h2>
      <p style="color:{_TEXT_MUTED};margin:0;font-size:15px;line-height:1.6;">
        You've joined the best marketplace for thrifted &amp; handcrafted goods.
        Let's start exploring!
      </p>
    </div>

    <!-- Features -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="margin:0 0 28px 0;border:1px solid {_BORDER_COLOR};border-radius:12px;overflow:hidden;">
      <tr style="background:{_BG_SUBTLE};">
        <td style="padding:16px 20px;border-bottom:1px solid {_BORDER_COLOR};">
          <span style="font-size:20px;">🛍️</span>
          <strong style="color:{_TEXT_DARK};margin-left:10px;font-size:14px;">Browse Thousands of Products</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid {_BORDER_COLOR};">
          <span style="font-size:20px;">💸</span>
          <strong style="color:{_TEXT_DARK};margin-left:10px;font-size:14px;">Sell Your Own Items Easily</strong>
        </td>
      </tr>
      <tr style="background:{_BG_SUBTLE};">
        <td style="padding:16px 20px;">
          <span style="font-size:20px;">🔒</span>
          <strong style="color:{_TEXT_DARK};margin-left:10px;font-size:14px;">Secure Payments via Stripe</strong>
        </td>
      </tr>
    </table>

    {_cta_button(FRONTEND_URL, "Start Exploring →")}
    """
    _send_html(to_email, "Welcome to Skimpy! 🎉", _email_wrapper(content))


# ─── LOGIN ALERT EMAIL ────────────────────────────────────────────────────────

def send_login_alert_email(user_data: dict):
    try:
        _send_login_alert_email(user_data)
    except Exception as e:
        logger.exception("Failed to send login alert email: %s", e)


def _send_login_alert_email(user_data: dict):
    first_name = user_data.get("first_name", "").strip() or "User"
    ip         = user_data.get("ip", "—")
    device     = user_data.get("device", "—")
    login_time = user_data.get("login_time", "—")
    to_email   = user_data.get("email", "").strip()
    if not to_email:
        return

    content = f"""
    <h2 style="color:{_TEXT_DARK};margin:0 0 8px 0;font-size:22px;font-weight:800;">
      🔔 New Login Detected
    </h2>
    <p style="color:{_TEXT_MUTED};margin:0 0 28px 0;font-size:15px;line-height:1.6;">
      Hi <strong>{first_name}</strong>, a new sign-in to your Skimpy account was just detected.
      If this was you, no action is needed.
    </p>

    <!-- Login details table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="border:1px solid {_BORDER_COLOR};border-radius:12px;overflow:hidden;margin:0 0 28px 0;">
      <tr style="background:{_BG_SUBTLE};">
        <td style="padding:14px 20px;color:{_TEXT_MUTED};font-size:13px;font-weight:600;
                   border-bottom:1px solid {_BORDER_COLOR};width:40%;">IP Address</td>
        <td style="padding:14px 20px;color:{_TEXT_DARK};font-size:14px;font-weight:600;
                   border-bottom:1px solid {_BORDER_COLOR};">{ip}</td>
      </tr>
      <tr>
        <td style="padding:14px 20px;color:{_TEXT_MUTED};font-size:13px;font-weight:600;
                   border-bottom:1px solid {_BORDER_COLOR};">Device</td>
        <td style="padding:14px 20px;color:{_TEXT_DARK};font-size:14px;font-weight:600;
                   border-bottom:1px solid {_BORDER_COLOR};">{device}</td>
      </tr>
      <tr style="background:{_BG_SUBTLE};">
        <td style="padding:14px 20px;color:{_TEXT_MUTED};font-size:13px;font-weight:600;">Time</td>
        <td style="padding:14px 20px;color:{_TEXT_DARK};font-size:14px;font-weight:600;">{login_time}</td>
      </tr>
    </table>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;
                padding:14px 18px;margin-bottom:8px;">
      <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
        ⚠️ <strong>Not you?</strong> Please change your password immediately and contact our support team.
      </p>
    </div>

    {_cta_button(f"{FRONTEND_URL}/profile", "Secure My Account →")}
    """
    _send_html(to_email, "🔔 New Login to Your Skimpy Account", _email_wrapper(content))


# ─── OTP VERIFIED EMAIL ───────────────────────────────────────────────────────

def send_otp_verified_email(to_email: str):
    try:
        _send_otp_verified_email(to_email)
    except Exception as e:
        logger.exception("Failed to send OTP verified email: %s", e)


def _send_otp_verified_email(to_email: str):
    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:72px;height:72px;background:#d1fae5;border-radius:50%;
                  display:inline-flex;align-items:center;justify-content:center;
                  margin-bottom:16px;font-size:36px;">✅</div>
      <h2 style="color:{_TEXT_DARK};margin:0 0 8px 0;font-size:24px;font-weight:800;">
        Account Verified!
      </h2>
      <p style="color:{_TEXT_MUTED};margin:0;font-size:15px;line-height:1.6;">
        Your Skimpy account is now fully active. Welcome to the marketplace —
        start browsing, buying, and selling today!
      </p>
    </div>

    {_cta_button(FRONTEND_URL, "Go to Skimpy →")}
    """
    _send_html(to_email, "✅ Account Verified — Welcome to Skimpy!", _email_wrapper(content))


# ─── ORDER INVOICE EMAIL ──────────────────────────────────────────────────────

def send_order_invoice_email(user_data: dict, order_summary: dict):
    try:
        _send_order_invoice_email(user_data, order_summary)
    except Exception as e:
        logger.exception("Failed to send order invoice email: %s", e)


def _send_order_invoice_email(user_data: dict, order_summary: dict):
    email = user_data.get("email", "").strip()
    if not email:
        return

    # ── Data extraction ──
    name       = user_data.get("name", "Valued Customer")
    order_ids  = order_summary.get("order_ids", [])
    order_id_display = f"#{order_ids[0]}" if order_ids else "#—"
    invoice_no = order_summary.get("payment_id", "—") or "—"
    products   = order_summary.get("products", [])
    total      = float(order_summary.get("total_amount", 0))
    shipping   = order_summary.get("shipping_address", {})
    order_date = order_summary.get("order_date", datetime.now().strftime("%Y-%m-%d"))
    delivery_date = order_summary.get("delivery_date", "")
    pay_status = order_summary.get("payment_status", "Paid")
    ord_status = order_summary.get("order_status", "Processing")

    # Shipping address lines
    full_name = shipping.get("fullname", name)
    addr1     = shipping.get("address_line1", "")
    addr2     = shipping.get("address_line2", "")
    city      = shipping.get("city", "")
    state     = shipping.get("state", "")
    pincode   = shipping.get("pincode", "")
    country   = shipping.get("country", "India")
    phone     = shipping.get("phone", "—")
    ship_addr = ", ".join(filter(None, [addr1, addr2, city, state, pincode, country]))

    # ── Product rows ──
    product_rows = ""
    subtotal = 0.0
    for p in products:
        p_name  = p.get("name", "Item")
        p_qty   = int(p.get("quantity", 1))
        p_price = float(p.get("price", 0))
        p_sub   = p_price * p_qty
        subtotal += p_sub
        img_url = p.get("image", "")
        img_tag = (
            f'<img src="{img_url}" alt="{p_name}" width="48" height="48" '
            f'style="width:48px;height:48px;object-fit:cover;border-radius:6px;'
            f'border:1px solid {_BORDER_COLOR};display:block;" />'
            if img_url else
            f'<div style="width:48px;height:48px;background:{_BG_SUBTLE};border-radius:6px;'
            f'border:1px solid {_BORDER_COLOR};display:flex;align-items:center;'
            f'justify-content:center;font-size:20px;">📦</div>'
        )
        product_rows += f"""
          <tr>
            <td style="padding:14px 12px;border-bottom:1px solid {_BORDER_COLOR};vertical-align:top;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:top;">{img_tag}</td>
                  <td style="vertical-align:middle;">
                    <div style="color:{_TEXT_DARK};font-size:14px;font-weight:600;line-height:1.4;">{p_name}</div>
                    <div style="color:{_TEXT_MUTED};font-size:12px;margin-top:2px;">Qty: {p_qty}</div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding:14px 12px;border-bottom:1px solid {_BORDER_COLOR};text-align:center;
                       vertical-align:middle;color:{_TEXT_BODY};font-size:14px;">{p_qty}</td>
            <td style="padding:14px 12px;border-bottom:1px solid {_BORDER_COLOR};text-align:right;
                       vertical-align:middle;color:{_TEXT_BODY};font-size:14px;">₹{p_price:,.2f}</td>
            <td style="padding:14px 12px;border-bottom:1px solid {_BORDER_COLOR};text-align:right;
                       vertical-align:middle;color:{_TEXT_DARK};font-size:14px;font-weight:600;">₹{p_sub:,.2f}</td>
          </tr>
        """

    shipping_charge = 0.0  # free shipping
    grand_total = total

    # Delivery date display
    delivery_str = (
        f'<tr><td style="padding:10px 0;color:{_TEXT_MUTED};font-size:13px;">Est. Delivery</td>'
        f'<td style="padding:10px 0;color:{_TEXT_DARK};font-size:13px;font-weight:600;text-align:right;">'
        f'{delivery_date}</td></tr>'
        if delivery_date else ""
    )

    content = f"""
    <!-- Invoice Title -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="margin-bottom:28px;">
      <tr>
        <td>
          <h2 style="color:{_TEXT_DARK};margin:0 0 4px 0;font-size:22px;font-weight:800;">
            Order Confirmed! 🎉
          </h2>
          <p style="color:{_TEXT_MUTED};margin:0;font-size:14px;">
            Hi <strong>{name}</strong>, thank you for your purchase on Skimpy.
          </p>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="background:{_BG_SUBTLE};border:1px solid {_BORDER_COLOR};
                      border-radius:8px;padding:10px 14px;display:inline-block;">
            <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:600;
                        text-transform:uppercase;letter-spacing:0.5px;">Order ID</div>
            <div style="color:{_BRAND_PRIMARY};font-size:15px;font-weight:800;
                        margin-top:2px;">{order_id_display}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Order Meta -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="background:{_BG_SUBTLE};border:1px solid {_BORDER_COLOR};
                  border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid {_BORDER_COLOR};width:50%;">
          <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:600;
                      text-transform:uppercase;letter-spacing:0.5px;">Order Date</div>
          <div style="color:{_TEXT_DARK};font-size:14px;font-weight:600;margin-top:3px;">{order_date}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid {_BORDER_COLOR};
                   border-left:1px solid {_BORDER_COLOR};">
          <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:600;
                      text-transform:uppercase;letter-spacing:0.5px;">Payment</div>
          <div style="color:#059669;font-size:14px;font-weight:700;margin-top:3px;">✅ {pay_status}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;width:50%;">
          <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:600;
                      text-transform:uppercase;letter-spacing:0.5px;">Status</div>
          <div style="color:{_BRAND_PRIMARY};font-size:14px;font-weight:600;margin-top:3px;">{ord_status}</div>
        </td>
        <td style="padding:12px 16px;border-left:1px solid {_BORDER_COLOR};">
          <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:600;
                      text-transform:uppercase;letter-spacing:0.5px;">Payment Ref</div>
          <div style="color:{_TEXT_DARK};font-size:12px;font-weight:600;margin-top:3px;
                      word-break:break-all;">{invoice_no[:30]}{'…' if len(invoice_no)>30 else ''}</div>
        </td>
      </tr>
    </table>

    <!-- Billing & Shipping (2-col, stacks on mobile) -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
           style="margin-bottom:24px;" class="two-col">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:10px;">
          <div style="background:{_BG_SUBTLE};border:1px solid {_BORDER_COLOR};
                      border-radius:12px;padding:16px;">
            <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📧 Buyer Info</div>
            <div style="color:{_TEXT_DARK};font-size:14px;font-weight:600;">{name}</div>
            <div style="color:{_TEXT_MUTED};font-size:13px;margin-top:4px;line-height:1.5;">{email}</div>
          </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:10px;">
          <div style="background:{_BG_SUBTLE};border:1px solid {_BORDER_COLOR};
                      border-radius:12px;padding:16px;">
            <div style="color:{_TEXT_MUTED};font-size:11px;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">🚚 Shipping To</div>
            <div style="color:{_TEXT_DARK};font-size:14px;font-weight:600;">{full_name}</div>
            <div style="color:{_TEXT_MUTED};font-size:13px;margin-top:4px;line-height:1.5;">{ship_addr}</div>
            <div style="color:{_TEXT_MUTED};font-size:13px;margin-top:4px;">📞 {phone}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Product Table -->
    <div style="margin-bottom:24px;">
      <div style="color:{_TEXT_DARK};font-size:14px;font-weight:700;
                  text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">🛍️ Order Items</div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
             style="border:1px solid {_BORDER_COLOR};border-radius:12px;overflow:hidden;"
             class="product-table">
        <!-- Table header -->
        <tr style="background:{_BG_SUBTLE};">
          <th style="padding:12px;text-align:left;color:{_TEXT_MUTED};font-size:12px;
                     font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                     border-bottom:2px solid {_BORDER_COLOR};">Product</th>
          <th style="padding:12px;text-align:center;color:{_TEXT_MUTED};font-size:12px;
                     font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                     border-bottom:2px solid {_BORDER_COLOR};width:60px;">Qty</th>
          <th style="padding:12px;text-align:right;color:{_TEXT_MUTED};font-size:12px;
                     font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                     border-bottom:2px solid {_BORDER_COLOR};width:80px;">Price</th>
          <th style="padding:12px;text-align:right;color:{_TEXT_MUTED};font-size:12px;
                     font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                     border-bottom:2px solid {_BORDER_COLOR};width:90px;">Subtotal</th>
        </tr>
        <!-- Product rows -->
        {product_rows}
      </table>
    </div>

    <!-- Billing Summary -->
    <div style="margin-bottom:28px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"
             style="margin-left:auto;width:260px;max-width:100%;">
        <tr>
          <td style="padding:8px 0;color:{_TEXT_MUTED};font-size:13px;">Subtotal</td>
          <td style="padding:8px 0;color:{_TEXT_BODY};font-size:13px;text-align:right;">₹{subtotal:,.2f}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:{_TEXT_MUTED};font-size:13px;">Shipping</td>
          <td style="padding:8px 0;color:#059669;font-size:13px;font-weight:600;text-align:right;">Free</td>
        </tr>
        {delivery_str}
        <!-- Divider -->
        <tr>
          <td colspan="2" style="padding:4px 0;">
            <div style="height:2px;background:{_BORDER_COLOR};"></div>
          </td>
        </tr>
        <!-- Grand Total -->
        <tr>
          <td style="padding:12px 0 4px 0;color:{_TEXT_DARK};font-size:16px;font-weight:800;">
            Grand Total
          </td>
          <td style="padding:12px 0 4px 0;text-align:right;font-size:20px;font-weight:900;
                     color:{_BRAND_PRIMARY};">₹{grand_total:,.2f}</td>
        </tr>
      </table>
    </div>

    <!-- Thank You Note -->
    <div style="background:linear-gradient(135deg,#f0f4ff,#faf5ff);
                border:1px solid #e0e7ff;border-radius:12px;padding:20px;
                text-align:center;margin-bottom:8px;">
      <div style="font-size:24px;margin-bottom:8px;">🙏</div>
      <h3 style="color:{_TEXT_DARK};margin:0 0 8px 0;font-size:16px;font-weight:700;">
        Thank You for Shopping with Skimpy!
      </h3>
      <p style="color:{_TEXT_MUTED};font-size:13px;margin:0;line-height:1.6;">
        We're preparing your order. You'll receive a shipping update soon.<br>
        For any issues, contact us at <a href="mailto:support@skimpy.com"
          style="color:{_BRAND_PRIMARY};font-weight:600;">support@skimpy.com</a>
      </p>
    </div>

    {_cta_button(f"{FRONTEND_URL}/my-orders", "Track My Order →")}
    """

    first_id = order_ids[0] if order_ids else "Order"
    _send_html(email, f"✅ Order Confirmed — {order_id_display} | Skimpy", _email_wrapper(content))
