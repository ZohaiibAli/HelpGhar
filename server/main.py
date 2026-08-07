from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config.db import db

from routes.customer_routes import router as customer_router
from routes.worker_routes import router as worker_router
from routes.admin_routes import router as admin_router
from routes.dispute import router as dispute_router
from routes.worker_dispute import router as worker_dispute_router
from routes.theme_routes import router as website_settings_router
from routes.chat_routes import router as chat_router
from routes.messaging_routes import router as messaging_router
from routes.booking_route import router as booking_router
from routes.payment_route import router as payment_router
from routes.review_routes import router as review_router
from routes.dashboard_route import router as dashboard_router
from routes.recommendation_routes import router as recommendation_router

from helper.seed_helper import seed_default_card

app = FastAPI(
    title="HelpGhar API",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    seed_default_card()


# ============================
# CORS Configuration
# ============================

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://help-ghar-beta.vercel.app"
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================
# Static Files
# ============================

if os.path.exists("uploads"):
    app.mount(
        "/uploads",
        StaticFiles(directory="uploads"),
        name="uploads"
    )


# ============================
# Routes
# ============================

app.include_router(customer_router)
app.include_router(worker_router)
app.include_router(admin_router)
app.include_router(dispute_router)
app.include_router(worker_dispute_router)
app.include_router(website_settings_router)
app.include_router(chat_router)
app.include_router(messaging_router)
app.include_router(booking_router)
app.include_router(payment_router)
app.include_router(review_router)
app.include_router(dashboard_router)
app.include_router(recommendation_router)


# ============================
# Root Endpoint
# ============================

@app.get("/")
def home():
    return {
        "message": "HelpGhar Backend Running",
        "database": db.name
    }


# ============================
# Health Check
# ============================

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {
        "status": "OK",
        "mongodb": "Connected"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )