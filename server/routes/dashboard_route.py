from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone

from helper.auth_helper import get_current_customer
from config.db import (
    booking_collection,
    payment_collection,
    review_collection,
    customer_collection,
    worker_collection,
    gig_collection,
    dispute_collection,
)
from helper.auth_helper import (
    get_current_customer,
    get_current_worker,
    get_current_admin,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in_progress"]

# A worker is only out of the verification queue once an admin has
# actually decided. Missing field == never reviewed, so $nin (which
# matches documents lacking the field) is what keeps legacy workers
# in the queue instead of silently passing them as verified.
PENDING_VERIFICATION_QUERY = {
    "verificationStatus": {"$nin": ["approved", "rejected"]}
}


def _as_utc(value):
    """
    Timestamps in this database are a mix of ISO strings (bookings,
    payments) and real datetimes (reviews, disputes), and payments
    carry a timezone while the rest don't. Normalise everything to
    naive UTC so they can be sorted and bucketed against each other.
    """

    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return None

    if not isinstance(value, datetime):
        return None

    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)

    return value


def _daily_series(items, field, value_fn, now, days=7):
    """Last `days` days of activity, oldest first, for the mini charts."""

    buckets = {
        (now - timedelta(days=offset)).date(): 0
        for offset in range(days - 1, -1, -1)
    }

    for item in items:
        moment = _as_utc(item.get(field))

        if moment is None:
            continue

        day = moment.date()

        if day in buckets:
            buckets[day] += value_fn(item)

    return [
        {
            "day": day.strftime("%a"),
            "date": day.isoformat(),
            "value": buckets[day],
        }
        for day in sorted(buckets)
    ]


def _window_total(items, field, value_fn, start, end):
    total = 0

    for item in items:
        moment = _as_utc(item.get(field))

        if moment is not None and start <= moment < end:
            total += value_fn(item)

    return total


def _money(value):
    """
    Rupee amounts are whole numbers, but seeded/legacy rows store them
    as floats -- without this the UI renders "Rs. 42,000.0".
    """

    try:
        return int(round(value or 0))
    except (TypeError, ValueError):
        return 0


def _trend(current, previous):
    """
    Percentage change vs the previous window. None means "no basis for
    comparison" -- the frontend shows a dash rather than inventing a
    number, which is what the hardcoded "+8.2%" badges used to do.
    """

    if previous == 0:
        return None if current == 0 else 100.0

    return round(((current - previous) / previous) * 100, 1)


@router.get("/customer")
def customer_dashboard(current_customer=Depends(get_current_customer)):
    customer_id = current_customer["customerId"]

    # Active bookings
    active_bookings = booking_collection.count_documents(
        {
            "customerId": customer_id,
            "status": {
                "$in": ACTIVE_BOOKING_STATUSES
            },
        }
    )

    # Total spent
    payments = list(
        payment_collection.find(
            {
                "customerId": customer_id
            }
        )
    )

    # Refunded payments no longer represent real spend -- exclude
    # them so a cancelled-after-paying booking doesn't keep inflating
    # this total forever.
    total_spent = _money(
        sum(
            payment.get("total", 0)
            for payment in payments
            if payment.get("status") == "successful"
        )
    )

    # Favourite workers (unique workers booked)
    worker_ids = booking_collection.distinct(
        "workerId",
        {
            "customerId": customer_id
        },
    )

    favorite_workers = len(worker_ids)

    # Reviews left
    reviews_left = review_collection.count_documents(
        {
            "customerId": customer_id
        }
    )

    return {
        "success": True,
        "stats": {
            "activeBookings": active_bookings,
            "totalSpent": total_spent,
            "favoriteWorkers": favorite_workers,
            "reviewsLeft": reviews_left,
        },
        # Real account activity. This panel used to render a hardcoded
        # mock list, so every customer saw the same three fictional
        # notifications about workers they had never booked.
        "notifications": _customer_notifications(customer_id),
    }


def _customer_notifications(customer_id: str, limit: int = 6):
    """Recent real events on this customer's account, newest first."""

    events = []

    booking_messages = {
        "pending": (
            "info",
            "Booking placed",
            "Your booking with {worker} is awaiting payment.",
        ),
        "confirmed": (
            "success",
            "Booking confirmed",
            "{worker} is confirmed for {date} at {slot}.",
        ),
        "in_progress": (
            "info",
            "Job in progress",
            "{worker} has started your {category} job.",
        ),
        "completed": (
            "success",
            "Job completed",
            "{worker} completed your {category} job.",
        ),
        "cancelled": (
            "warning",
            "Booking cancelled",
            "Your booking with {worker} was cancelled.",
        ),
    }

    recent_bookings = booking_collection.find(
        {"customerId": customer_id}
    ).sort("createdAt", -1).limit(10)

    for booking in recent_bookings:

        entry = booking_messages.get(booking.get("status"))

        if not entry:
            continue

        kind, title, template = entry

        events.append({
            "id": f"booking-{booking.get('bookingId')}",
            "type": kind,
            "title": title,
            "message": template.format(
                worker=booking.get("workerName", "your worker"),
                date=booking.get("date", ""),
                slot=booking.get("timeSlot", ""),
                category=booking.get("category", "service"),
            ),
            "at": _as_utc(booking.get("createdAt")),
        })

    recent_payments = payment_collection.find(
        {"customerId": customer_id}
    ).sort("date", -1).limit(10)

    for payment in recent_payments:

        refunded = payment.get("status") == "refunded"

        events.append({
            "id": f"payment-{payment.get('id')}",
            "type": "info" if refunded else "success",
            "title": "Refund issued" if refunded else "Payment successful",
            "message": (
                f"Rs. {_money(payment.get('total')):,} "
                f"{'refunded for' if refunded else 'paid for'} "
                f"booking {payment.get('bookingId', '')}."
            ),
            "at": _as_utc(payment.get("date")),
        })

    recent_reviews = review_collection.find(
        {"customerId": customer_id}
    ).sort("createdAt", -1).limit(5)

    for review in recent_reviews:

        events.append({
            "id": f"review-{review.get('reviewId')}",
            "type": "info",
            "title": "Review submitted",
            "message": (
                f"You rated {review.get('workerName', 'a worker')} "
                f"{review.get('rating', 0)} out of 5."
            ),
            "at": _as_utc(review.get("createdAt")),
        })

    recent_disputes = dispute_collection.find(
        {"customerId": customer_id, "filedBy": "customer"}
    ).sort("createdAt", -1).limit(5)

    for dispute in recent_disputes:

        resolved = str(dispute.get("status", "")).lower() == "resolved"

        events.append({
            "id": f"dispute-{dispute.get('disputeId')}",
            "type": "success" if resolved else "warning",
            "title": "Dispute resolved" if resolved else "Dispute open",
            "message": dispute.get("subject", "You filed a dispute."),
            "at": _as_utc(dispute.get("createdAt")),
        })

    events = [event for event in events if event["at"] is not None]

    events.sort(key=lambda event: event["at"], reverse=True)

    return [
        {
            "id": event["id"],
            "type": event["type"],
            "title": event["title"],
            "message": event["message"],
            "date": event["at"].isoformat(),
        }
        for event in events[:limit]
    ]


@router.get("/worker")
def worker_dashboard(current_worker=Depends(get_current_worker)):
    worker_id = current_worker["workerId"]  # human-readable code, e.g. "WRK-0001"

    # All bookings for this worker
    all_bookings = list(
        booking_collection.find({"workerId": worker_id})
    )

    total_jobs = len(all_bookings)

    completed_bookings = [b for b in all_bookings if b.get("status") == "completed"]
    completed_jobs = len(completed_bookings)

    completion_rate = (
        round((completed_jobs / total_jobs) * 100, 1) if total_jobs else 0
    )

    # A worker earns `amount`; `total` is what the customer paid,
    # including the 5% platform fee that never reaches the worker.
    # Summing `total` here overstated every worker's earnings.
    total_earnings = _money(sum(b.get("amount", 0) for b in completed_bookings))

    # Active jobs: pending / confirmed / in_progress
    active_jobs = [
        {
            "bookingId": b["bookingId"],
            "category": b.get("category"),
            "address": b.get("address"),
            "date": b.get("date"),
            "timeSlot": b.get("timeSlot"),
            "durationHours": b.get("durationHours"),
            "customerName": b.get("customerName"),
            "status": b.get("status"),
        }
        for b in all_bookings
        if b.get("status") in ACTIVE_BOOKING_STATUSES
    ]

    # Reviews / rating
    reviews = list(review_collection.find({"workerId": worker_id}))
    reviews_count = len(reviews)
    avg_rating = (
        round(sum(r.get("rating", 0) for r in reviews) / reviews_count, 1)
        if reviews_count
        else 0
    )

    # Availability is a property of the worker's live listings, not a
    # decoration -- the dashboard badge used to say "Available now"
    # even for a worker with no active gig at all.
    active_gigs = list(
        gig_collection.find({"workerId": worker_id, "status": "Active"})
    )

    available = any(gig.get("available", True) for gig in active_gigs)

    return {
        "success": True,
        "stats": {
            "totalJobs": total_jobs,
            "completedJobs": completed_jobs,
            "completionRate": completion_rate,
            "avgRating": avg_rating,
            "reviewsCount": reviews_count,
            "totalEarnings": total_earnings,
            "activeGigs": len(active_gigs),
            "available": available,
            "pendingJobs": sum(
                1 for b in all_bookings if b.get("status") == "pending"
            ),
        },
        "activeJobs": active_jobs,
    }


@router.get("/public-stats")
def public_stats():
    """
    Public: the handful of real figures the landing page hero shows.

    Those numbers were literals in the JSX -- "4.9" average rating,
    "100%" verified, "50K+" happy users -- so they described a
    marketplace that doesn't exist and never moved as the real one grew.
    No authentication: this is the same information any visitor can
    already derive by browsing the worker listings.
    """

    total_workers = worker_collection.count_documents({})

    verified_workers = worker_collection.count_documents(
        {"verificationStatus": "approved"}
    )

    completed_bookings = booking_collection.count_documents(
        {"status": "completed"}
    )

    customers = customer_collection.count_documents({})

    ratings = [
        review.get("rating", 0)
        for review in review_collection.find({}, {"rating": 1})
    ]

    return {
        "success": True,
        "stats": {
            "workers": total_workers,
            "verifiedWorkers": verified_workers,
            "verifiedPercentage": (
                round((verified_workers / total_workers) * 100)
                if total_workers
                else 0
            ),
            "customers": customers,
            "completedBookings": completed_bookings,
            "avgRating": (
                round(sum(ratings) / len(ratings), 1) if ratings else 0
            ),
            "reviewsCount": len(ratings),
        },
    }


def _category_breakdown(limit: int = 6):
    """
    Which services actually drive the marketplace, by booking volume and
    the revenue they brought in. Cancelled bookings are counted in the
    volume (they still represent demand) but contribute no revenue,
    since that money was refunded.
    """

    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "bookings": {"$sum": 1},
                "revenue": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$status", "cancelled"]},
                            0,
                            {"$ifNull": ["$total", 0]},
                        ]
                    }
                },
            }
        },
        {"$sort": {"bookings": -1}},
        {"$limit": limit},
    ]

    rows = [row for row in booking_collection.aggregate(pipeline) if row["_id"]]

    peak = max((row["bookings"] for row in rows), default=0)

    return [
        {
            "category": row["_id"],
            "bookings": row["bookings"],
            "revenue": _money(row["revenue"]),
            # Share of the busiest category, so the frontend can draw a
            # bar without needing to know the maximum itself.
            "share": round((row["bookings"] / peak) * 100) if peak else 0,
        }
        for row in rows
    ]


def _status_breakdown():
    """Every booking status with its count, including the ones at zero."""

    counts = {
        row["_id"]: row["count"]
        for row in booking_collection.aggregate(
            [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
        )
    }

    return {
        status: counts.get(status, 0)
        for status in (
            "pending",
            "confirmed",
            "in_progress",
            "completed",
            "cancelled",
        )
    }


@router.get("/admin")
def admin_dashboard(current_admin=Depends(get_current_admin)):
    """
    Real platform figures for the admin overview. Every number on that
    page used to be a literal in the JSX ("12,480" users, "Rs. 4.2M"
    revenue, "+8.2%" growth), so it never changed and never matched
    the database.
    """

    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    previous_week_start = now - timedelta(days=14)

    total_customers = customer_collection.count_documents({})
    total_workers = worker_collection.count_documents({})

    pending_verifications = worker_collection.count_documents(
        PENDING_VERIFICATION_QUERY
    )

    total_bookings = booking_collection.count_documents({})

    active_bookings = booking_collection.count_documents(
        {"status": {"$in": ACTIVE_BOOKING_STATUSES}}
    )

    completed_bookings = booking_collection.count_documents(
        {"status": "completed"}
    )

    open_complaints = dispute_collection.count_documents(
        {"status": {"$regex": "^open$", "$options": "i"}}
    )

    # Pulled in full (projected) because the same rows drive the
    # totals, the 7-day trend and the chart series.
    bookings = list(
        booking_collection.find({}, {"createdAt": 1})
    )

    payments = list(
        payment_collection.find(
            {"status": "successful"},
            {"total": 1, "platformFee": 1, "date": 1},
        )
    )

    gross_revenue = _money(sum(payment.get("total", 0) for payment in payments))
    platform_earnings = _money(
        sum(payment.get("platformFee", 0) for payment in payments)
    )

    reviews = list(review_collection.find({}, {"rating": 1}))

    avg_rating = (
        round(sum(review.get("rating", 0) for review in reviews) / len(reviews), 2)
        if reviews
        else 0
    )

    one = lambda _: 1
    revenue_of = lambda payment: _money(payment.get("total"))

    bookings_this_week = _window_total(
        bookings, "createdAt", one, week_start, now
    )
    bookings_last_week = _window_total(
        bookings, "createdAt", one, previous_week_start, week_start
    )

    revenue_this_week = _window_total(
        payments, "date", revenue_of, week_start, now
    )
    revenue_last_week = _window_total(
        payments, "date", revenue_of, previous_week_start, week_start
    )

    return {
        "success": True,
        "stats": {
            "totalUsers": total_customers + total_workers,
            "totalCustomers": total_customers,
            "totalWorkers": total_workers,
            "pendingVerifications": pending_verifications,
            "totalBookings": total_bookings,
            "activeBookings": active_bookings,
            "completedBookings": completed_bookings,
            "grossRevenue": gross_revenue,
            "platformEarnings": platform_earnings,
            "openComplaints": open_complaints,
            "avgRating": avg_rating,
            "reviewsCount": len(reviews),
        },
        "trends": {
            "bookings": _trend(bookings_this_week, bookings_last_week),
            "revenue": _trend(revenue_this_week, revenue_last_week),
        },
        "series": {
            "bookings": _daily_series(bookings, "createdAt", one, now),
            "revenue": _daily_series(payments, "date", revenue_of, now),
        },
        "categories": _category_breakdown(),
        "statusBreakdown": _status_breakdown(),
        "verificationQueue": _verification_queue(),
    }


def _verification_queue(limit: int = 8):
    """
    Workers still awaiting a verification decision. The admin page used
    to list *gigs* here and print a CNIC generated with Math.random()
    on every render -- a different fake number each time React redrew.
    """

    pending_workers = list(
        worker_collection.find(PENDING_VERIFICATION_QUERY)
        .sort("_id", -1)
        .limit(limit)
    )

    worker_ids = [
        worker.get("workerId")
        for worker in pending_workers
        if worker.get("workerId")
    ]

    avatars = {}

    for gig in gig_collection.find(
        {"workerId": {"$in": worker_ids}}, {"workerId": 1, "avatar": 1}
    ):
        avatars.setdefault(gig["workerId"], gig.get("avatar", ""))

    return [
        {
            "workerId": worker.get("workerId"),
            "fullName": worker.get("fullName", ""),
            "email": worker.get("email", ""),
            "category": worker.get("category", ""),
            "cnic": worker.get("cnic", ""),
            "avatar": avatars.get(worker.get("workerId"), ""),
            # No createdAt is stored at registration, but an ObjectId
            # already encodes its own creation time.
            "appliedAt": worker["_id"].generation_time.isoformat(),
        }
        for worker in pending_workers
    ]
