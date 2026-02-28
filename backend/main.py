from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError
from routers import auth, generate, credits, admin
from middleware.rate_limiter import setup_rate_limiter

app = FastAPI(title="Nur — Islamic Script Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten to your Streamlit URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_rate_limiter(app)

app.include_router(auth.router,     prefix="/auth",     tags=["Auth"])
app.include_router(generate.router, prefix="/generate", tags=["Generate"])
app.include_router(credits.router,  prefix="/credits",  tags=["Credits"])
app.include_router(admin.router,    prefix="/admin",    tags=["Admin"])


@app.exception_handler(APIError)
async def supabase_api_error_handler(_, exc: APIError):
    code = None
    message = "Database request failed."

    if isinstance(exc.args, tuple) and exc.args:
        payload = exc.args[0] if isinstance(exc.args[0], dict) else {}
        code = payload.get("code")
        message = payload.get("message") or message

    if code == "PGRST205":
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Supabase tables are missing. Run supabase/schema.sql in your Supabase SQL Editor, "
                    "then retry registration/generation."
                )
            },
        )

    return JSONResponse(status_code=500, content={"detail": message})


@app.get("/")
def root():
    return {"status": "Nur API running ✦", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
