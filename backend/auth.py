"""Jeton de session signé (HMAC-SHA256) avec expiration.

Format : `<charge utile base64url>.<signature base64url>`, la charge utile étant
`{"iat": <émis à>, "exp": <expire à>}` (secondes Unix). La clé de signature
`PULSE_SECRET_KEY` ne quitte jamais le serveur : la changer invalide tous les jetons.
"""
import base64
import hashlib
import hmac
import json
import logging
import os
import time

from fastapi import Header, HTTPException

logger = logging.getLogger("pulse.auth")

DEFAULT_TTL_DAYS = 30


def _secret() -> bytes:
    secret = os.getenv("PULSE_SECRET_KEY", "")
    if not secret:
        raise HTTPException(status_code=500, detail="PULSE_SECRET_KEY not configured")
    if len(secret) < 32:
        logger.warning("PULSE_SECRET_KEY trop courte (< 32 caractères) : en générer une avec secrets.token_hex(32)")
    return secret.encode()


def _ttl_seconds() -> int:
    return int(os.getenv("PULSE_TOKEN_TTL_DAYS", str(DEFAULT_TTL_DAYS))) * 86400


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(payload: str) -> str:
    return _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())


def create_token(now: float | None = None) -> tuple[str, int]:
    """Renvoie (jeton, date d'expiration en secondes Unix)."""
    issued = int(time.time() if now is None else now)
    expires = issued + _ttl_seconds()
    payload = _b64(json.dumps({"iat": issued, "exp": expires}, separators=(",", ":")).encode())
    return f"{payload}.{_sign(payload)}", expires


def verify_token(token: str, now: float | None = None) -> bool:
    parts = token.split(".")
    if len(parts) != 2:
        return False
    payload, signature = parts
    if not hmac.compare_digest(signature, _sign(payload)):
        return False
    try:
        expires = int(json.loads(_unb64(payload))["exp"])
    except (ValueError, KeyError, TypeError):
        return False
    return (time.time() if now is None else now) < expires


def require_auth(authorization: str = Header(None)):
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    if not token or not verify_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
