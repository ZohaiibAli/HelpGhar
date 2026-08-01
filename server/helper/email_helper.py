import os
from dotenv import load_dotenv

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from pydantic import EmailStr

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

async def send_reset_email(email: EmailStr, reset_link: str):

    message = MessageSchema(
        subject="Reset your HelpGhar Password",
        recipients=[email],
        body=f"""
Hello,

You requested to reset your HelpGhar password.

Click the link below:

{reset_link}

This link will expire in 15 minutes.

If you didn't request this, simply ignore this email.

Thank you,
HelpGhar Team
""",
        subtype="plain",
    )

    fm = FastMail(conf)

    await fm.send_message(message)