"""
insights.py — SensAI backend routes
Handles:
  - /insights/ai         — Groq proxy for all AI-powered frontend features
  - Platform score comparisons (DB aggregation)
  - Cache management
  - Health check
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os, datetime, json, re
from database import db
from groq import Groq

router = APIRouter(prefix="/insights", tags=["Insights"])

# ── Groq client (lazy init) ───────────────────────────────────
_groq_client = None

def get_groq():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in .env")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def safe_json(text: str):
    """Strip markdown fences and parse JSON — same pattern used across all SensAI modules."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


# ── AI proxy ──────────────────────────────────────────────────

class AIRequest(BaseModel):
    prompt: str
    system: Optional[str] = (
        "You are a career intelligence expert. "
        "Always respond with valid JSON only — no markdown fences, no preamble, no extra text."
    )

@router.post("/ai")
def ai_proxy(req: AIRequest):
    """
    Single proxy endpoint for all AI calls from IndustryInsights frontend.
    Keeps the Groq API key safely on the backend.
    """
    try:
        client = get_groq()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": req.system},
                {"role": "user",   "content": req.prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        raw = completion.choices[0].message.content
        data = safe_json(raw)
        return {"result": data}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Health / ping ─────────────────────────────────────────────

@router.get("/ping")
def ping():
    return {"status": "ok", "ts": datetime.datetime.utcnow().isoformat()}


# ── Platform score comparison (zero AI, DB only) ──────────────

@router.get("/platform-scores/{job_role}")
def platform_scores(job_role: str):
    """Aggregate mock interview scores from the DB for a given role."""
    pipeline = [
        {"$match": {"job_role": {"$regex": job_role, "$options": "i"}}},
        {"$group": {
            "_id": "$job_role",
            "avg_score":      {"$avg": "$overall_score"},
            "count":          {"$sum": 1},
            "avg_readiness":  {"$avg": "$readiness_percentage"},
            "top_score":      {"$max": "$overall_score"},
        }},
    ]
    results = list(db["interview_sessions"].aggregate(pipeline))
    return {"comparisons": results}


# ── User interview history (for My Scores) ────────────────────

@router.get("/user-sessions/{email}")
def user_sessions(email: str):
    """Return a user's last 20 interview sessions, most recent first."""
    sessions = list(
        db["interview_sessions"]
        .find({"user_email": email}, {"_id": 0})
        .sort("created_at", -1)
        .limit(20)
    )
    return {"sessions": sessions}


# ── Cache management ──────────────────────────────────────────

@router.delete("/cache")
def clear_cache():
    db["insights_cache"].delete_many({})
    db["role_explainer_cache"].delete_many({})
    return {"cleared": True, "ts": datetime.datetime.utcnow().isoformat()}


@router.get("/cache/status")
def cache_status():
    def stats(col_name):
        col = db[col_name]
        count = col.count_documents({})
        oldest = col.find_one(sort=[("cached_at", 1)], projection={"_id": 0, "type": 1, "cached_at": 1})
        newest = col.find_one(sort=[("cached_at", -1)], projection={"_id": 0, "type": 1, "cached_at": 1})
        return {"count": count, "oldest": oldest, "newest": newest}

    return {
        "insights_cache":       stats("insights_cache"),
        "role_explainer_cache": stats("role_explainer_cache"),
    }