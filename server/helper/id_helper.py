from config.db import counter_collection
from pymongo import ReturnDocument


def generate_customer_id():

    counter = counter_collection.find_one_and_update(

        {

            "_id": "customer"

        },

        {

            "$inc": {

                "sequence": 1

            }

        },

        upsert=True,

        return_document=ReturnDocument.AFTER

    )

    sequence = counter["sequence"]

    return f"HGC-{sequence:03d}"


def generate_worker_id():

    counter = counter_collection.find_one_and_update(
        {
            "_id": "workerid"
        },
        {
            "$inc": {
                "sequence_value": 1
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    number = counter["sequence_value"]

    return f"HGW-{number:03d}"


def generate_customer_dispute_id():

    counter = counter_collection.find_one_and_update(
        {
            "_id": "customerdispute"
        },
        {
            "$inc": {
                "sequence": 1
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    sequence = counter["sequence"]

    return f"HGCD-{sequence:04d}"


def generate_worker_dispute_id():

    counter = counter_collection.find_one_and_update(
        {
            "_id": "workerdispute"
        },
        {
            "$inc": {
                "sequence": 1
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    sequence = counter["sequence"]

    return f"HGWD-{sequence:04d}"

def _next_sequence(name: str) -> int:
    counter = counter_collection.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"]

def generate_booking_id():
    seq = _next_sequence("booking_id")
    return f"BKG-{seq:04d}"

def generate_transaction_id():
    seq = _next_sequence("transaction_id")
    return f"TXN-{seq:05d}"

def generate_thread_id():
    seq = _next_sequence("message_thread_id")
    return f"THR-{seq:05d}"


def generate_review_id():

    counter = counter_collection.find_one_and_update(
        {"_id": "reviewId"},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )

    number = counter["sequence_value"]

    return f"HGR-{number:03d}"