import os
from twilio.rest import Client
from db import get_db

twilio = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
FROM = os.environ["TWILIO_WHATSAPP_FROM"]


async def send_whatsapp_alert(profile_id: str, transcript_excerpt: str, severity: str) -> None:
    try:
        db = get_db()
        profile = db.table("profiles").select("user_id, companion_name").eq("id", profile_id).single().execute().data
        if not profile:
            return
        phone_row = db.table("caregiver_phones").select("phone").eq("user_id", profile["user_id"]).single().execute().data
        if not phone_row:
            return

        message = (
            f"Mitra Alert — {profile['companion_name']}\n\n"
            f"Severity: {severity.upper()}\n\n"
            f"What they said:\n{transcript_excerpt}\n\n"
            f"Mitra is with them and speaking calmly. Please check in when you can."
        )

        twilio.messages.create(
            from_=FROM,
            to=f"whatsapp:{phone_row['phone']}",
            body=message,
        )
    except Exception as e:
        print(f"WhatsApp alert failed: {e}")
