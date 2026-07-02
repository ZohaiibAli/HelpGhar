# This is my main.py file for the FastAPI backend of the HelpGhar project. It sets up the FastAPI application, configures CORS middleware, serves static files from the uploads directory, and includes routers for customer, worker, and admin routes. Additionally, it defines two endpoints: one for checking if the backend is running and another for health checks to verify MongoDB connectivity.
from fastapi import FastAPI
from config.db import db
from routes.customer_routes import router as customer_router
from routes.worker_routes import router as worker_router
from routes.admin_routes import router as admin_router
from fastapi.middleware.cors import CORSMiddleware
from routes.dispute import router as dispute_router
from routes.worker_dispute import router as worker_dispute_router
from fastapi.staticfiles import StaticFiles
from routes.theme_routes import router as website_settings_router


app = FastAPI(title="HelpGhar API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(customer_router)
app.include_router(dispute_router)
app.include_router(worker_dispute_router)
app.include_router(worker_router)
app.include_router(admin_router)
app.include_router(website_settings_router)

@app.get("/")
def home():
    return {"message": "HelpGhar Backend Running", "database": db.name}

@app.get("/health")
def health():
    return {"status": "OK", "mongodb": "Connected"}