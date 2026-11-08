from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from config.db import worker_collection
from helper.auth_helper import get_current_admin, get_current_worker
from helper.email_helper import send_plain_email, _sign
from helper.password_helper import verify_password
from helper.payout_helper import (
    METHODS,
    PayoutError,
    full_view,
    masked,
    payout_collection,
    serialize_payout,
    title_matches_name,
    validate_payout,
)

worker_router = APIRouter(prefix="/worker", tags=["Worker Payouts"])
admin_router = APIRouter(prefix="/admin", tags=["Admin Payouts"])


class PayoutDetailsUpdate(BaseModel):
    method: Literal["bank", "jazzcash", "easypaisa"]
    accountTitle: str
    bankName: Optional[str] = None
    iban: Optional[str] = None
    mobileNumber: Optional[str] = None
    # Changing where money goes needs the password, so a stolen session
    # alone can't redirect a worker's earnings.
    currentPassword: str = Field(min_length=1)


class MarkPaid(BaseModel):
    reference: str = Field(min_length=3, max_length=100)
    note: Optional[str] = Field(default=None, max_length=300)


def _worker_or_404(user):
    worker = worker_collection.find_one({"workerId": user["workerId"]})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


def _totals(worker_id: str) -> dict:
    totals = {"pending": 0, "paid": 0}
    for row in payout_collection.aggregate([
        {"$match": {"workerId": worker_id}},
        {"$group": {"_id": "$status", "sum": {"$sum": "$amount"}}},
    ]):
        totals[row["_id"]] = row["sum"]
    return {"awaitingPayout": totals.get("pending", 0), "paidOut": totals.get("paid", 0)}


# ---------------------------------------------------------------- worker


@worker_router.get("/payout-details")
def get_payout_details(user=Depends(get_current_worker)):
    worker = _worker_or_404(user)
    return {"success": True, "payout": masked(worker.get("payout"))}


@worker_router.put("/payout-details")
def update_payout_details(
    payload: PayoutDetailsUpdate,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_worker),
):
    worker = _worker_or_404(user)

    if not verify_password(payload.currentPassword, worker["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    try:
        payout = validate_payout(
            payload.method, payload.accountTitle, payload.bankName, payload.iban, payload.mobileNumber
        )
    except PayoutError as e:
        raise HTTPException(status_code=400, detail=str(e))

    payout["updatedAt"] = datetime.utcnow().isoformat()

    worker_collection.update_one(
        {"_id": worker["_id"]},
        {
            "$set": {
                "payout": payout,
                "payoutTitleMatchesName": title_matches_name(payout["accountTitle"], worker.get("fullName", "")),
            },
            "$push": {"payoutHistory": {"changedAt": payout["updatedAt"], "method": payout["method"]}},
        },
    )

    if worker.get("email"):
        view = masked(payout)
        background_tasks.add_task(
            send_plain_email,
            worker["email"],
            "Your HelpGhar payout details were changed",
            _sign(f"""
Hello {worker.get("fullName") or "there"},

The account HelpGhar sends your earnings to was just changed:

Method        : {view["methodLabel"]}
Account title : {view["accountTitle"]}
Account       : {view["account"]}

If you did not make this change, change your password immediately and
contact HelpGhar support so we can hold your payouts.
"""),
        )

    return {"success": True, "message": "Payout details updated", "payout": masked(payout)}


@worker_router.get("/payouts")
def get_my_payouts(user=Depends(get_current_worker)):
    payouts = [
        serialize_payout(p)
        for p in payout_collection.find({"workerId": user["workerId"]}).sort("createdAt", -1)
    ]
    return {"success": True, "payouts": payouts, **_totals(user["workerId"])}


# ----------------------------------------------------------------- admin


@admin_router.get("/payouts")
def list_payouts(
    status: Literal["pending", "paid", "all"] = Query("pending"),
    current_admin=Depends(get_current_admin),
):
    query = {} if status == "all" else {"status": status}
    payouts = list(payout_collection.find(query).sort("createdAt", -1 if status != "pending" else 1))

    workers = {
        w["workerId"]: w
        for w in worker_collection.find(
            {"workerId": {"$in": list({p["workerId"] for p in payouts})}},
            {"workerId": 1, "fullName": 1, "email": 1, "phone": 1, "payout": 1, "payoutTitleMatchesName": 1},
        )
    }

    result = []
    for p in payouts:
        worker = workers.get(p["workerId"], {})
        row = serialize_payout(p)
        # Pending: pay to the CURRENT details. Paid: the account it went to.
        row["payoutDetails"] = full_view(p.get("paidTo") or worker.get("payout"))
        row["payoutTitleMatchesName"] = worker.get("payoutTitleMatchesName")
        row["workerPhone"] = worker.get("phone")
        result.append(row)

    pending_total = sum(
        r["sum"] for r in payout_collection.aggregate([
            {"$match": {"status": "pending"}},
            {"$group": {"_id": None, "sum": {"$sum": "$amount"}}},
        ])
    )

    return {"success": True, "payouts": result, "pendingTotal": pending_total}


@admin_router.patch("/payouts/{payout_id}/paid")
def mark_payout_paid(
    payout_id: str,
    payload: MarkPaid,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_admin),
):
    payout = payout_collection.find_one({"payoutId": payout_id})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    worker = worker_collection.find_one({"workerId": payout["workerId"]}) or {}
    details = worker.get("payout")
    if not details:
        raise HTTPException(
            status_code=400,
            detail="This worker has no payout details yet. Ask them to add them in Settings.",
        )

    now = datetime.utcnow().isoformat()
    result = payout_collection.update_one(
        {"payoutId": payout_id, "status": "pending"},
        {
            "$set": {
                "status": "paid",
                "paidAt": now,
                "paidBy": str(current_admin["_id"]),
                "reference": payload.reference.strip(),
                "note": (payload.note or "").strip() or None,
                # Snapshot: later edits to the worker's details mustn't
                # rewrite where an old payment actually went.
                "paidTo": details,
            }
        },
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="This payout is already marked as paid")

    if worker.get("email"):
        view = masked(details)
        background_tasks.add_task(
            send_plain_email,
            worker["email"],
            f"HelpGhar payout {payout_id}: Rs. {payout['amount']:,} sent",
            _sign(f"""
Hello {worker.get("fullName") or "there"},

Your earnings for booking {payout["bookingId"]} have been sent.

Amount        : Rs. {payout["amount"]:,}
Sent to       : {view["methodLabel"]} - {view["account"]} ({view["accountTitle"]})
Reference     : {payload.reference.strip()}

Depending on your bank or wallet it can take a little while to show up.
You can see all your payouts on your HelpGhar dashboard.
"""),
        )

    return {"success": True, "message": f"Payout {payout_id} marked as paid"}
