from fastapi import FastAPI
from config.db import db

from routes.customer import router as customer_router
from routes.worker import router as worker_router
from routes.admin import router as admin_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HelpGhar API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customer_router)
app.include_router(worker_router)
app.include_router(admin_router)

@app.get("/")
def home():
    return {
        "message": "HelpGhar Backend Running",
        "database": db.name
    }


@app.get("/health")
def health():
    return {
        "status": "OK",
        "mongodb": "Connected"
    }