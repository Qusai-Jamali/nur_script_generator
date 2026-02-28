from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal, Optional
from database import get_supabase
from auth_utils import require_admin

router = APIRouter()


class CreditAdjust(BaseModel):
    user_id: str
    credits: int
    plan:    Optional[Literal["free", "basic", "standard", "pro"]] = None
    note:    Optional[str] = ""


class ToggleUser(BaseModel):
    user_id:   str
    is_active: bool


@router.get("/dashboard")
def dashboard(_: bool = Depends(require_admin)):
    db = get_supabase()
    users   = db.table("users").select("id", count="exact").execute()
    scripts = db.table("scripts").select("id", count="exact").execute()

    # Credits distributed total
    credit_rows = db.table("users").select("credits").execute()
    total_credits = sum(r.get("credits", 0) for r in (credit_rows.data or []))

    # Scripts by category
    cat_rows = db.table("scripts").select("category").execute()
    cat_counts: dict = {}
    for r in (cat_rows.data or []):
        c = r.get("category", "unknown")
        cat_counts[c] = cat_counts.get(c, 0) + 1

    return {
        "total_users":   users.count,
        "total_scripts": scripts.count,
        "total_credits": total_credits,
        "scripts_by_category": cat_counts,
    }


@router.get("/users")
def list_users(
    search: Optional[str] = None,
    _: bool = Depends(require_admin),
):
    db = get_supabase()
    query = db.table("users").select(
        "id, name, email, credits, plan, is_active, created_at"
    ).order("created_at", desc=True)

    rows = query.execute()
    users = rows.data or []

    if search:
        s = search.lower()
        users = [u for u in users if s in u.get("email", "").lower()
                 or s in u.get("name", "").lower()]

    return {"users": users, "total": len(users)}


@router.post("/credits/adjust")
def adjust_credits(req: CreditAdjust, _: bool = Depends(require_admin)):
    db = get_supabase()

    update_data: dict = {"credits": req.credits}
    if req.plan:
        update_data["plan"] = req.plan

    result = db.table("users").update(update_data).eq("id", req.user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "message":     f"Credits set to {req.credits}.",
        "user_id":     req.user_id,
        "new_credits": req.credits,
        "new_plan":    req.plan,
    }


@router.post("/users/toggle")
def toggle_user(req: ToggleUser, _: bool = Depends(require_admin)):
    db = get_supabase()
    db.table("users").update({"is_active": req.is_active}).eq("id", req.user_id).execute()
    state = "activated" if req.is_active else "suspended"
    return {"message": f"User {state} successfully.", "user_id": req.user_id}


@router.get("/scripts")
def list_scripts(
    user_id: Optional[str] = None,
    limit: int = 50,
    _: bool = Depends(require_admin),
):
    db = get_supabase()
    query = (
        db.table("scripts")
        .select("id, user_id, topic, youtube_title, category, tone, duration, language, created_at")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if user_id:
        query = query.eq("user_id", user_id)

    rows = query.execute()
    return {"scripts": rows.data or [], "total": len(rows.data or [])}


@router.delete("/scripts/{script_id}")
def admin_delete_script(script_id: str, _: bool = Depends(require_admin)):
    db = get_supabase()
    db.table("scripts").delete().eq("id", script_id).execute()
    return {"message": "Script deleted."}
