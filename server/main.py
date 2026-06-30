# This is my main.py file for the FastAPI backend of the HelpGhar project. It sets up the FastAPI application, configures CORS middleware, serves static files from the uploads directory, and includes routers for customer, worker, and admin routes. Additionally, it defines two endpoints: one for checking if the backend is running and another for health checks to verify MongoDB connectivity.
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from config.db import db
from routes.customer_routes import router as customer_router
from routes.worker_routes import router as worker_router
from routes.admin import router as admin_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HelpGhar API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 serves files from server/uploads/ at http://localhost:8000/uploads/filename.jpg
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(customer_router)
app.include_router(worker_router)
app.include_router(admin_router)

@app.get("/")
def home():
    return {"message": "HelpGhar Backend Running", "database": db.name}

@app.get("/health")
def health():
    return {"status": "OK", "mongodb": "Connected"}