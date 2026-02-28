from fastapi import APIRouter, Depends
from auth_utils import get_current_user

router = APIRouter()

# Credit plans — defined here for frontend to fetch
PLANS = {
    "basic": {
        "name":      "Basic",
        "credits":   10,
        "prompts":   10,
        "label":     "10 Scripts",
        "popular":   False,
        "note":      "Great for getting started",
    },
    "standard": {
        "name":      "Standard",
        "credits":   50,
        "prompts":   50,
        "label":     "50 Scripts",
        "popular":   True,
        "note":      "Most popular for active creators",
    },
    "pro": {
        "name":      "Pro",
        "credits":   100,
        "prompts":   100,
        "label":     "100 Scripts",
        "popular":   False,
        "note":      "For full-time Islamic content studios",
    },
}


@router.get("/balance")
def get_balance(user: dict = Depends(get_current_user)):
    return {
        "credits": user["credits"],
        "plan":    user["plan"],
    }


@router.get("/plans")
def get_plans():
    """Returns plan definitions for the frontend to display."""
    return {"plans": PLANS}
