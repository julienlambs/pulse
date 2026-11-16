import os
import threading
import time
from collections import deque

import bcrypt
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from auth import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Limite des tentatives de connexion (mémoire du processus, remise à zéro au redémarrage)
WINDOW_SECONDS = 15 * 60  # fenêtre glissante
MAX_FAILURES_PER_IP = 5   # échecs tolérés par IP dans la fenêtre
MAX_FAILURES_GLOBAL = 50  # toutes IP confondues : borne l'attaque même si l'IP est falsifiée
FAILURE_DELAY_SECONDS = 1.0  # pause après chaque échec, ralentit les essais en rafale
MAX_TRACKED_IPS = 10_000

_lock = threading.Lock()
_failures_by_ip: dict[str, deque] = {}
_failures_global: deque = deque()


class LoginBody(BaseModel):
    password: str = Field(min_length=1, max_length=128)


def client_ip(request: Request) -> str:
    """IP réelle du visiteur : Cloudflare la transmet dans CF-Connecting-IP (nginx relaie l'en-tête)."""
    return (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-real-ip")
        or (request.client.host if request.client else "inconnue")
    ).strip()


def _prune(failures: deque, now: float) -> None:
    while failures and failures[0] <= now - WINDOW_SECONDS:
        failures.popleft()


def _retry_after(ip: str, now: float) -> int:
    """Secondes d'attente si la limite est atteinte, sinon 0."""
    with _lock:
        _prune(_failures_global, now)
        waits = []
        if len(_failures_global) >= MAX_FAILURES_GLOBAL:
            waits.append(_failures_global[0] + WINDOW_SECONDS - now)
        ip_failures = _failures_by_ip.get(ip)
        if ip_failures is not None:
            _prune(ip_failures, now)
            if len(ip_failures) >= MAX_FAILURES_PER_IP:
                waits.append(ip_failures[0] + WINDOW_SECONDS - now)
        return int(max(waits)) + 1 if waits else 0


def _record_failure(ip: str, now: float) -> None:
    with _lock:
        if len(_failures_by_ip) >= MAX_TRACKED_IPS:
            for key in [k for k, v in _failures_by_ip.items() if not v or v[-1] <= now - WINDOW_SECONDS]:
                del _failures_by_ip[key]
        _failures_by_ip.setdefault(ip, deque()).append(now)
        _failures_global.append(now)


def _clear_failures(ip: str) -> None:
    with _lock:
        _failures_by_ip.pop(ip, None)


def reset_limits() -> None:
    """Pour les tests."""
    with _lock:
        _failures_by_ip.clear()
        _failures_global.clear()


@router.post("/login")
def login(body: LoginBody, request: Request):
    password_hash = os.getenv("PULSE_PASSWORD_HASH", "")
    if not password_hash or not os.getenv("PULSE_SECRET_KEY", ""):
        raise HTTPException(status_code=500, detail="Auth not configured")

    ip = client_ip(request)
    wait = _retry_after(ip, time.time())
    if wait:
        raise HTTPException(
            status_code=429,
            detail="Trop de tentatives, réessaie plus tard",
            headers={"Retry-After": str(wait)},
        )

    if not bcrypt.checkpw(body.password.encode(), password_hash.encode()):
        _record_failure(ip, time.time())
        time.sleep(FAILURE_DELAY_SECONDS)
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    _clear_failures(ip)
    token, expires_at = create_token()
    return {"token": token, "expires_at": expires_at}
