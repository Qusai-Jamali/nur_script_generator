from datetime import datetime, timedelta
import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import get_settings
from database import get_supabase

security = get_settings  # lazy import trick avoided — keep explicit
_security = HTTPBearer()
settings = get_settings()


# ── Password ──────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT ───────────────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


# ── FastAPI dependencies ───────────────────────────────────────────────────────
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    payload = decode_token(credentials.credentials)
    db = get_supabase()
    result = db.table("users").select("*").eq("id", payload["sub"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return result.data


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> bool:
    if credentials.credentials != settings.ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Admin access denied.")
    return True
