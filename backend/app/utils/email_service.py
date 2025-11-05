import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

def send_otp_email(to_email: str, otp: str):
    sender_email = os.getenv("sender_email")
    sender_password = os.getenv("sender_password")  

    # Email body
    msg = MIMEText(f"Your OTP code is {otp}. It will expire in 5 minutes.")
    msg["Subject"] = "Your OTP Code"
    msg["From"] = sender_email
    msg["To"] = to_email

    # Send mail
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
    except Exception as e:
        raise Exception(f"Failed to send email: {e}")
