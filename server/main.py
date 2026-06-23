from fastapi import FastAPI
from config.db import db

app = FastAPI(
    title="HelpGhar API",
    version="1.0.0"
)


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