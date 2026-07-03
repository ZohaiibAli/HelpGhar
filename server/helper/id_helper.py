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
        return_document=True
    )

    number = counter["sequence_value"]

    return f"HGW-{number:03d}"