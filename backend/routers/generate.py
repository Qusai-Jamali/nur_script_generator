import uuid
from datetime import datetime
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, Depends
from google.api_core.exceptions import ResourceExhausted
from pydantic import BaseModel
from database import get_supabase
from auth_utils import get_current_user
from ai_client import call_ai
from prompts.templates import SYSTEM_PROMPT, build_user_prompt

router = APIRouter()
CREDIT_COST = 1


class GenerateRequest(BaseModel):
    topic:       str
    category:    Literal["prophets_teachings", "sahaba_stories",
                         "islamic_history", "religious_content", "custom"]
    audience:    Literal["youth", "general", "scholarly"]
    tone:        Literal["emotional", "poetic", "historical", "motivational"]
    output_type: Literal["youtube_long", "shorts", "both"]
    duration:    Literal["1min", "5min", "10min"]
    language:    Literal["english", "urdu", "arabic"] = "english"
    notes:       Optional[str] = None


@router.post("/")
async def generate(req: GenerateRequest, user: dict = Depends(get_current_user)):
    db = get_supabase()

    if user["credits"] < CREDIT_COST:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits. Please contact admin to add credits to your account.",
        )

    # Build + call AI
    user_prompt = build_user_prompt(
        topic=req.topic, category=req.category, audience=req.audience,
        tone=req.tone, output_type=req.output_type, duration=req.duration,
        language=req.language, notes=req.notes or "",
    )

    try:
        result = await call_ai(SYSTEM_PROMPT, user_prompt)
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail=(
                "Gemini quota/rate limit reached. Wait and retry, or upgrade billing/quota for your Gemini project."
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "AI generation failed. Check AI provider configuration and API key in backend/.env, then retry."
            ),
        )

    # Deduct credit atomically
    new_credits = user["credits"] - CREDIT_COST
    db.table("users").update({"credits": new_credits}).eq("id", user["id"]).execute()

    # Persist script
    script_id = str(uuid.uuid4())
    db.table("scripts").insert({
        "id":            script_id,
        "user_id":       user["id"],
        "topic":         req.topic,
        "category":      req.category,
        "tone":          req.tone,
        "duration":      req.duration,
        "output_type":   req.output_type,
        "language":      req.language,
        "youtube_title": result.get("youtube_title", req.topic),
        "result_json":   result,
        "created_at":    datetime.utcnow().isoformat(),
    }).execute()

    return {
        "script_id":         script_id,
        "credits_remaining": new_credits,
        "result":            result,
    }


@router.get("/history")
def get_history(user: dict = Depends(get_current_user)):
    db = get_supabase()
    rows = (
        db.table("scripts")
        .select("id, topic, youtube_title, category, tone, duration, language, created_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"scripts": rows.data}


@router.get("/{script_id}")
def get_script(script_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase()
    row = (
        db.table("scripts")
        .select("*")
        .eq("id", script_id)
        .eq("user_id", user["id"])  # users can only see their own
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Script not found.")
    return row.data


@router.delete("/{script_id}")
def delete_script(script_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("scripts").delete().eq("id", script_id).eq("user_id", user["id"]).execute()
    return {"message": "Script deleted."}
