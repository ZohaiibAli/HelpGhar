from config.db import booking_collection


def booked_counterparts(role: str, user_id: str) -> list:
    """
    Everyone this customer (or worker) has actually had a booking with,
    most recently booked first, each listed once with their bookings
    newest-first. Powers the "file a complaint against" picker, which
    used to list every account on the platform.
    """

    me, other, other_name = (
        ("customerId", "workerId", "workerName")
        if role == "customer"
        else ("workerId", "customerId", "customerName")
    )

    bookings = booking_collection.find(
        {me: user_id, other: {"$nin": [None, ""]}},
        {
            "_id": 0, "bookingId": 1, other: 1, other_name: 1, "category": 1,
            "date": 1, "timeSlot": 1, "status": 1, "createdAt": 1,
        },
    ).sort("createdAt", -1)

    people = {}

    for booking in bookings:
        person = people.setdefault(booking[other], {
            other: booking[other],
            "fullName": booking.get(other_name) or ("Worker" if role == "customer" else "Customer"),
            "lastBookedAt": booking.get("createdAt"),
            "lastCategory": booking.get("category"),
            "bookings": [],
        })

        person["bookings"].append({
            "bookingId": booking["bookingId"],
            "category": booking.get("category"),
            "date": booking.get("date"),
            "timeSlot": booking.get("timeSlot"),
            "status": booking.get("status"),
        })

    # dicts keep insertion order, and bookings were read newest-first.
    return list(people.values())
