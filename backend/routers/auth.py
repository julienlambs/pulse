import os
import bcrypt
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: dict):
    password_hash = os.getenv("PULSE_PASSWORD_HASH", "")
    secret_key    = os.getenv("PULSE_SECRET_KEY", "")
    if not password_hash or not secret_key:
        raise HTTPException(status_code=500, detail="Auth not configured")
    password = body.get("password", "")
    if not bcrypt.checkpw(password.encode(), password_hash.encode()):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    return {"token": secret_key}
