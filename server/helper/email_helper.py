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


async def send_plain_email(email: EmailStr, subject: str, body: str):
    """Fire-and-forget plain-text email; failures are logged, never raised,
    so a mail outage can't undo the action that triggered it."""

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype="plain",
    )

    try:
        await FastMail(conf).send_message(message)
    except Exception as e:
        print(f"Could not send email '{subject}':", str(e))


def _sign(body: str) -> str:
    return body.strip("\n") + "\n\nRegards,\nHelpGhar\n"


def complaint_received_email(name, dispute_id, subject, against_name, booking_id):
    return (
        f"HelpGhar complaint {dispute_id} received",
        _sign(f"""
Hello {name or "there"},

We have received your complaint and our team will review it within
24 hours.

Complaint ID : {dispute_id}
Subject      : {subject}
Against      : {against_name}
Booking ID   : {booking_id}

You can track the status of this complaint anytime on the Disputes page
of your HelpGhar account. We will email you when there is an update.
"""),
    )


def complaint_action_taken_email(name, dispute_id, subject):
    return (
        f"Update on your HelpGhar complaint {dispute_id}",
        _sign(f"""
Hello {name or "there"},

The HelpGhar team has reviewed your complaint and taken action on it.

Complaint ID : {dispute_id}
Subject      : {subject}

For privacy reasons we can't share the details of the action taken
against the other account. Thank you for helping keep HelpGhar safe.
"""),
    )


def complaint_resolved_email(name, dispute_id, subject):
    return (
        f"Your HelpGhar complaint {dispute_id} has been resolved",
        _sign(f"""
Hello {name or "there"},

Your complaint has been marked as resolved by the HelpGhar team.

Complaint ID : {dispute_id}
Subject      : {subject}

If the issue is still not sorted out, you can file a new complaint from
the Disputes page of your HelpGhar account.
"""),
    )


def account_moderated_email(name, action, reason, until_text):
    if action == "suspended":
        headline = f"Your HelpGhar account has been suspended until {until_text}."
        subject = "Your HelpGhar account has been suspended"
    else:
        headline = "Your HelpGhar account has been blocked."
        subject = "Your HelpGhar account has been blocked"

    return (
        subject,
        _sign(f"""
Hello {name or "there"},

{headline}

Reason: {reason}

While your account is {action} you will not be able to log in or use
HelpGhar. Any upcoming bookings have been cancelled and paid bookings
have been refunded to the customer.

If you believe this is a mistake, please reply to this email or contact
HelpGhar support.
"""),
    )


def account_restored_email(name):
    return (
        "Your HelpGhar account has been restored",
        _sign(f"""
Hello {name or "there"},

Good news - your HelpGhar account has been restored. You can log in and
use HelpGhar again as normal.
"""),
    )


def booking_cancelled_by_admin_email(name, booking_id, worker_name, refunded):
    refund_line = (
        "Your payment for this booking has been refunded."
        if refunded
        else "No payment had been made for this booking, so nothing was charged."
    )
    return (
        f"Your HelpGhar booking {booking_id} has been cancelled",
        _sign(f"""
Hello {name or "there"},

Your booking {booking_id} with {worker_name} has been cancelled because
the worker's account is no longer active on HelpGhar.

{refund_line}

We're sorry for the inconvenience. You can book another worker anytime
from the Services page.
"""),
    )


async def send_completion_pin_email(
    email: EmailStr,
    name: str,
    booking_id: str,
    worker_name: str,
    category: str,
    date: str,
    time_slot: str,
    pin: str,
):

    message = MessageSchema(
        subject=f"Your HelpGhar booking {booking_id} is confirmed - completion PIN",
        recipients=[email],
        body=f"""
Hello {name or "Customer"},

Your payment was received and your booking is confirmed.

Booking ID : {booking_id}
Service    : {category}
Worker     : {worker_name}
Date/Time  : {date}, {time_slot}

Your job completion PIN is: {pin}

Your payment is held safely by HelpGhar and is released to the worker
only when the job is marked as done using this PIN.

Please share this PIN with the worker ONLY after the work has been
completed to your satisfaction. Never share it before the job is done.
You can also see this PIN anytime in My Bookings.

Regards,
HelpGhar
""",
        subtype="plain",
    )

    fm = FastMail(conf)

    try:
        await fm.send_message(message)
    except Exception as e:
        # Payment is already saved and the PIN is visible in My Bookings.
        print("Could not send completion PIN email:", str(e))