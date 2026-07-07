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