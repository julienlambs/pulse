import os
from fastapi import Header, HTTPException


def require_auth(authorization: str = Header(None)):
    secret = os.getenv("PULSE_SECRET_KEY", "")
    if not secret:
        raise HTTPException(status_code=500, detail="PULSE_SECRET_KEY not configured")
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    if token != secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
