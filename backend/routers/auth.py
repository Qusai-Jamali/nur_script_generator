import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from database import get_supabase
from auth_utils import hash_password, verify_password, create_token, get_current_user
from config import get_settings

router = APIRouter()
settings = get_settings()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    db = get_supabase()
    existing = db.table("users").select("id").eq("email", req.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user_id = str(uuid.uuid4())
    db.table("users").insert({
        "id":            user_id,
        "name":          req.name,
        "email":         req.email,
        "password_hash": hash_password(req.password),
        "credits":       settings.STARTER_CREDITS,
        "plan":          "free",
        "is_active":     True,
    }).execute()

    token = create_token(user_id, req.email)
    return {
        "token": token,
        "user":  {"id": user_id, "name": req.name,
                  "email": req.email, "credits": settings.STARTER_CREDITS, "plan": "free"},
    }


@router.post("/login")
def login(req: LoginRequest):
    db = get_supabase()
    result = db.table("users").select("*").eq("email", req.email).single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = result.data
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")

    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user":  {"id": user["id"], "name": user["name"],
                  "email": user["email"], "credits": user["credits"], "plan": user["plan"]},
    }


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {
        "id":      user["id"],
        "name":    user["name"],
        "email":   user["email"],
        "credits": user["credits"],
        "plan":    user["plan"],
    }
