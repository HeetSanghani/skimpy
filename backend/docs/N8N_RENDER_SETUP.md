# n8n on Render – Fix "Database is not ready!" (503)

If your n8n instance at **https://skimpy-n8n.onrender.com/** returns:

```json
{ "code": 503, "message": "Database is not ready!" }
```

n8n is running but cannot connect to its database. Fix it as follows.

## 1. Add a PostgreSQL database on Render

1. In the [Render Dashboard](https://dashboard.render.com/), create a **PostgreSQL** database (not Redis).
2. Wait until it is **Available** and note the **Internal Database URL** (or the individual env vars).

## 2. Set environment variables on the n8n service

In your **n8n** Web Service on Render → **Environment**:

| Variable | Value |
|----------|--------|
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_HOST` | *(from your Postgres service)* |
| `DB_POSTGRESDB_PORT` | `5432` |
| `DB_POSTGRESDB_DATABASE` | *(database name)* |
| `DB_POSTGRESDB_USER` | *(user)* |
| `DB_POSTGRESDB_PASSWORD` | *(password)* |

**Or** use the single connection URL:

| Variable | Value |
|----------|--------|
| `DB_TYPE` | `postgresdb` |
| `DATABASE_URL` | `postgresql://user:password@host:5432/database` |

Use the **Internal Database URL** from your Render Postgres service so n8n (same Render account) can reach it over the private network.

## 3. Redeploy n8n

After saving the environment variables, trigger a **Manual Deploy** for the n8n service. Wait for the deploy to finish. The first request may be slow while the DB connects.

## 4. Backend: set webhook URL

On your **backend** service (e.g. Skimpy API on Render), set:

| Variable | Example value |
|----------|----------------|
| `N8N_SEND_OTP_WEBHOOK_URL` | `https://skimpy-n8n.onrender.com/webhook/send-otp` |

Use the **Production URL** from the "Send OTP Webhook" node in your **Skimpy Notifications & Orders** workflow (open the node → Webhook URLs → Production). The path must match the workflow (e.g. `send-otp`). Redeploy the backend after adding the env var.

## 5. Gmail in production

OTP and other emails are sent via **n8n's Gmail node** only (no SMTP fallback). With Google OAuth configured in **production** (correct redirect URI for your n8n URL, e.g. `https://skimpy-n8n.onrender.com/...`), the Gmail credential stays valid and n8n can send mail long-term.

## 6. Connection checklist (backend ↔ n8n, register flow)

- **Backend env:** `N8N_SEND_OTP_WEBHOOK_URL` = `https://skimpy-n8n.onrender.com/webhook/send-otp` (no trailing slash).
- **n8n workflow:** "Skimpy Notifications & Orders" is **Active** (published). The "Send OTP Webhook" node uses path `send-otp`, method POST, Production URL.
- **n8n Gmail node:** Uses `$json.body.email` and `$json.body.otp`; backend sends `{"email": "...", "otp": "...", "timestamp": "..."}`.
- **Cold start (Render free):** Backend and n8n can spin down. First request may take up to ~60s; the app uses longer timeouts. If the first try fails, "Try again" usually works once services are awake.
