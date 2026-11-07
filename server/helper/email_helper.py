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


async def send_worker_approved_email(email: EmailStr, name: str = "worker"):

    message = MessageSchema(
        subject="Your HelpGhar Worker Account is Approved",
        recipients=[email],
        body=f"""
Hello {name or "worker"},

Congratulations! Your CNIC has been verified and your HelpGhar worker
account is now approved.

You can now log in to the HelpGhar app, set up your services and start
accepting jobs from customers.

We are happy to have you on board and wish you great success.

Regards,
HelpGhar
""",
        subtype="plain",
    )

    fm = FastMail(conf)

    try:
        await fm.send_message(message)
    except Exception as e:
        # The approval is already saved; a mail failure must not undo it.
        print("Could not send worker approval email:", str(e))


async def send_worker_rejected_email(email: EmailStr, name: str = "worker"):

    message = MessageSchema(
        subject="Update on your HelpGhar Worker Account",
        recipients=[email],
        body=f"""
Hello {name or "worker"},

Thank you for registering with HelpGhar.

Unfortunately, we were unable to verify your CNIC, so your HelpGhar
worker account could not be approved at this time.

If you believe this is a mistake or would like to submit your details
again, please contact HelpGhar support.

Regards,
HelpGhar
""",
        subtype="plain",
    )

    fm = FastMail(conf)

    try:
        await fm.send_message(message)
    except Exception as e:
        # The rejection is already saved; a mail failure must not undo it.
        print("Could not send worker rejection email:", str(e))