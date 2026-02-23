# Skimpy Email Setup

All transactional emails (OTP, signup, login, order invoice) are sent directly from the backend.  
**n8n is not required.**

The backend now supports **two transports**:

1. **Gmail API over HTTPS (recommended on Render)**
2. **SMTP (Gmail)** as a fallback when direct SMTP is allowed

On Render free tier, direct SMTP to `smtp.gmail.com:465` is often blocked, so Gmail API is the
reliable choice.

---

## Option 1 — Gmail API (recommended)

### Env variables (Render → Environment)

| Variable | Description |
|----------|-------------|
| `GMAIL_CLIENT_ID` | OAuth client ID from Google Cloud Console (Desktop or Web client) |
| `GMAIL_CLIENT_SECRET` | OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Long‑lived refresh token for the Gmail account sending emails |
| `GMAIL_USER_EMAIL` | The Gmail address that will appear in the From field |
| `FRONTEND_URL` | (Optional) Base URL for links in emails. Default: `https://skimpy.vercel.app` |

### High‑level setup steps

1. Go to **Google Cloud Console → APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** (Desktop or Web app) and note:
   - `client_id`
   - `client_secret`
3. Use either the **OAuth 2.0 Playground** or a small local script to obtain a
   **refresh token** for the Gmail account:
   - Authorize the scope `https://www.googleapis.com/auth/gmail.send`.
   - Exchange the authorization code for a refresh token.
4. In Render, set:
   - `GMAIL_CLIENT_ID` = your client id
   - `GMAIL_CLIENT_SECRET` = your client secret
   - `GMAIL_REFRESH_TOKEN` = the refresh token from step 3
   - `GMAIL_USER_EMAIL` = the Gmail address that will send emails
5. Redeploy the backend. On startup you should see in logs:
   `Email: using Gmail API transport (HTTPS).`

The backend will automatically:

- Exchange the refresh token for short‑lived access tokens.
- Call `https://gmail.googleapis.com/gmail/v1/users/me/messages/send` to send
  HTML emails using the existing templates.

---

## Option 2 — SMTP (Gmail, fallback only)

Use this **only** in environments where outbound SMTP to `smtp.gmail.com:465` is allowed.

### Env variables

| Variable | Description |
|----------|-------------|
| `sender_email` | Gmail address used to send emails |
| `sender_password` | [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your normal password) |

If Gmail API variables are not set, the backend will fall back to SMTP.

---

## Emails Sent

- **OTP** — Registration and forgot-password OTP codes
- **Signup welcome** — After successful registration
- **Login alert** — After successful login (IP, device, time)
- **OTP verified** — Confirmation after OTP verification
- **Order invoice** — Order confirmation with items and shipping address

## Support Chat

The n8n Support Bot has been removed. When users message Skimpy Support, they receive an immediate static reply:  
*"Thanks for reaching out! We've received your message. Our team will review it and get back to you shortly."*
