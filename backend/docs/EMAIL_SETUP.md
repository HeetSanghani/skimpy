# Skimpy Email Setup (SMTP)

All transactional emails (OTP, signup, login, order invoice) are sent directly from the backend via SMTP. **No n8n required.**

## Required Environment Variables

Set these on your backend (e.g. Render):

| Variable | Description |
|----------|-------------|
| `sender_email` | Gmail address used to send emails |
| `sender_password` | [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your normal password) |
| `FRONTEND_URL` | (Optional) Base URL for links in emails. Default: `https://skimpy.vercel.app` |

## Emails Sent

- **OTP** — Registration and forgot-password OTP codes
- **Signup welcome** — After successful registration
- **Login alert** — After successful login (IP, device, time)
- **OTP verified** — Confirmation after OTP verification
- **Order invoice** — Order confirmation with items and shipping address

## Support Chat

The n8n Support Bot has been removed. When users message Skimpy Support, they receive an immediate static reply: *"Thanks for reaching out! We've received your message. Our team will review it and get back to you shortly."*
