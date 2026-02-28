# NUR — Deployment Guide
## Supabase + FastAPI (Railway) + React/Vite (Vercel)

## 1) Switch AI provider to OpenAI
Set these values in `backend/.env` (local) and Railway variables (production):

- `AI_PROVIDER=openai`
- `OPENAI_API_KEY=sk-...`
- `GEMINI_API_KEY=unused_when_openai`
- `GEMINI_MODEL=gemini-2.5-flash` (ignored when OpenAI is active)

## 2) Supabase setup
1. Create project in Supabase.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (service_role key)

## 3) Push project to GitHub
From repo root:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## 4) Deploy backend to Railway
1. Railway → New Project → Deploy from GitHub repo.
2. Set **Root Directory** to `backend`.
3. Add variables in Railway:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=unused_when_openai
GEMINI_MODEL=gemini-2.5-flash
JWT_SECRET=<strong-random-secret>
JWT_EXPIRE_HOURS=72
STARTER_CREDITS=30
ADMIN_SECRET=<strong-random-secret>
```

4. Deploy and copy backend URL, e.g. `https://your-backend.up.railway.app`.

## 5) Deploy frontend to Vercel
1. Vercel → Add New Project → import same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: `Vite` (auto-detected).
4. Add env var:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

5. Deploy.

## 6) Local run (quick)

```bash
# Backend
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

- Backend health: `http://localhost:8000/health`
- Frontend local: `http://localhost:5173`

## Notes
- Never commit real secrets; `.gitignore` excludes `.env` files.
- If old keys were exposed anywhere, rotate them (Supabase service key, OpenAI key, JWT secret, Admin secret).
