import os

import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    password: str = Field(min_length=1, max_length=128)


@router.post("/login")
def login(body: LoginBody):
    password_hash = os.getenv("PULSE_PASSWORD_HASH", "")
    if not password_hash or not os.getenv("PULSE_SECRET_KEY", ""):
        raise HTTPException(status_code=500, detail="Auth not configured")
    if not bcrypt.checkpw(body.password.encode(), password_hash.encode()):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    token, expires_at = create_token()
    return {"token": token, "expires_at": expires_at}
