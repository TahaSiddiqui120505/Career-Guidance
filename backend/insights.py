from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq
import os, json, re, datetime
from dotenv import load_dotenv
from database import db

load_dotenv()
router = APIRouter(prefix="/insights", tags=["Insights"])
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

def safe_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise

def is_cache_valid(doc, hours: int = 168) -> bool:
    """Returns True if cached doc is still fresh within given hours."""
    if not doc or "cached_at" not in doc:
        return False
    cached = datetime.datetime.fromisoformat(doc["cached_at"])
    return (datetime.datetime.utcnow() - cached).total_seconds() < hours * 3600


# ── 1. Market Pulse (weekly, cached) ─────────────────────────

@router.get("/market-pulse")
def market_pulse():
    cached = db["insights_cache"].find_one({"type": "market_pulse"}, {"_id": 0})
    if is_cache_valid(cached):
        return {"pulse": cached["data"], "cached_at": cached["cached_at"], "from_cache": True}

    prompt = """You are a hiring market analyst. Generate a weekly market pulse summary for job seekers in Finance, Tech, and Consulting.

Return ONLY JSON:
{
  "week_summary": "<2 sentence overview of hiring market this week>",
  "sectors": [
    {
      "name": "Investment Banking",
      "trend": "up|flat|down",
      "signal": "<1 sentence — what's happening in hiring>",
      "hot_roles": ["<role1>", "<role2>"]
    },
    {
      "name": "Technology",
      "trend": "up|flat|down",
      "signal": "<1 sentence>",
      "hot_roles": ["<role1>", "<role2>"]
    },
    {
      "name": "Consulting",
      "trend": "up|flat|down",
      "signal": "<1 sentence>",
      "hot_roles": ["<role1>", "<role2>"]
    },
    {
      "name": "Private Equity",
      "trend": "up|flat|down",
      "signal": "<1 sentence>",
      "hot_roles": ["<role1>", "<role2>"]
    },
    {
      "name": "Asset Management",
      "trend": "up|flat|down",
      "signal": "<1 sentence>",
      "hot_roles": ["<role1>", "<role2>"]
    }
  ],
  "top_tip": "<one actionable job search tip this week>"
}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800, temperature=0.5,
    )
    data = safe_json(res.choices[0].message.content)
    now = datetime.datetime.utcnow().isoformat()
    db["insights_cache"].update_one(
        {"type": "market_pulse"},
        {"$set": {"type": "market_pulse", "data": data, "cached_at": now}},
        upsert=True
    )
    return {"pulse": data, "cached_at": now, "from_cache": False}


# ── 2. Difficulty Forecast (weekly, cached) ──────────────────

@router.get("/difficulty-forecast")
def difficulty_forecast():
    cached = db["insights_cache"].find_one({"type": "difficulty_forecast"}, {"_id": 0})
    if is_cache_valid(cached):
        return {"forecast": cached["data"], "cached_at": cached["cached_at"], "from_cache": True}

    prompt = """You are a hiring market analyst. Generate a current interview difficulty forecast for major sectors.

Return ONLY JSON:
{
  "overall_verdict": "<1 sentence overall market assessment>",
  "sectors": [
    {
      "sector": "Investment Banking",
      "difficulty": "easier|same|harder",
      "change": "<1 sentence reason>",
      "rounds_avg": <number>,
      "tip": "<1 sentence prep tip>"
    },
    {"sector": "Technology", "difficulty": "easier|same|harder", "change": "<1 sentence>", "rounds_avg": <number>, "tip": "<1 sentence>"},
    {"sector": "Consulting", "difficulty": "easier|same|harder", "change": "<1 sentence>", "rounds_avg": <number>, "tip": "<1 sentence>"},
    {"sector": "Private Equity", "difficulty": "easier|same|harder", "change": "<1 sentence>", "rounds_avg": <number>, "tip": "<1 sentence>"},
    {"sector": "Asset Management", "difficulty": "easier|same|harder", "change": "<1 sentence>", "rounds_avg": <number>, "tip": "<1 sentence>"}
  ]
}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=700, temperature=0.4,
    )
    data = safe_json(res.choices[0].message.content)
    now = datetime.datetime.utcnow().isoformat()
    db["insights_cache"].update_one(
        {"type": "difficulty_forecast"},
        {"$set": {"type": "difficulty_forecast", "data": data, "cached_at": now}},
        upsert=True
    )
    return {"forecast": data, "cached_at": now, "from_cache": False}


# ── 3. AI Role Explainer (per role, cached) ──────────────────

class RoleRequest(BaseModel):
    role: str

@router.post("/role-explainer")
def role_explainer(data: RoleRequest):
    cache_key = data.role.lower().strip().replace(" ", "_")
    cached = db["role_explainer_cache"].find_one({"role_key": cache_key}, {"_id": 0})
    if cached:
        return {"explainer": cached["data"], "from_cache": True}

    prompt = f"""You are a senior career advisor. Explain the role of: {data.role}

Return ONLY JSON:
{{
  "role": "{data.role}",
  "summary": "<2 sentence plain-English description>",
  "day_in_life": ["<task 1>", "<task 2>", "<task 3>", "<task 4>"],
  "core_skills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"],
  "how_to_break_in": "<2-3 sentences on the most realistic path in>",
  "salary_range": {{"entry": "<range>", "mid": "<range>", "senior": "<range>", "currency": "USD"}},
  "exit_opportunities": ["<path 1>", "<path 2>", "<path 3>"],
  "interview_format": "<brief description of typical interview process>",
  "difficulty_to_get": "very hard|hard|medium|accessible",
  "top_employers": ["<employer 1>", "<employer 2>", "<employer 3>", "<employer 4>"]
}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800, temperature=0.4,
    )
    result = safe_json(res.choices[0].message.content)
    db["role_explainer_cache"].insert_one({"role_key": cache_key, "data": result})
    return {"explainer": result, "from_cache": False}


# ── 4. Cold Email Generator ──────────────────────────────────

class ColdEmailRequest(BaseModel):
    sender_background: str
    target_role:       str
    target_company:    str
    target_person_title: Optional[str] = None
    email_type:        str = "cold_email"  # cold_email | linkedin_dm

@router.post("/cold-email")
def cold_email(data: ColdEmailRequest):
    type_instruction = "a cold LinkedIn DM (under 150 words, conversational)" if data.email_type == "linkedin_dm" \
        else "a cold outreach email (150-200 words, professional)"

    prompt = f"""Write {type_instruction} for a job seeker.

Sender background: {data.sender_background}
Target role: {data.target_role}
Target company: {data.target_company}
Target person title: {data.target_person_title or "Hiring Manager / Recruiter"}

Rules:
- Do NOT use generic phrases like "I hope this finds you well"
- Open with a specific, genuine hook about the company
- Be concise and direct — respect their time
- End with one clear, easy-to-say-yes-to ask
- Sound human, not AI-generated

Return ONLY JSON:
{{"subject": "<email subject if applicable, else null>", "message": "<the full message>", "type": "{data.email_type}"}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400, temperature=0.7,
    )
    return safe_json(res.choices[0].message.content)


# ── 5. Platform score comparison (zero AI) ──────────────────

@router.get("/platform-scores/{job_role}")
def platform_scores(job_role: str):
    pipeline = [
        {"$match": {"job_role": {"$regex": job_role, "$options": "i"}}},
        {"$group": {
            "_id": "$job_role",
            "avg_score": {"$avg": "$overall_score"},
            "count": {"$sum": 1},
            "avg_readiness": {"$avg": "$readiness_percentage"},
        }}
    ]
    results = list(db["interview_sessions"].aggregate(pipeline))
    return {"comparisons": results}


# ── 6. Dynamic Salary Benchmarks (any role + market) ─────────

class SalaryRequest(BaseModel):
    role:   str
    market: str = "US"  # US | India | UK | Singapore | UAE | Global

@router.post("/salary")
def salary_benchmarks(data: SalaryRequest):
    cache_key = f"salary_{data.role.lower().strip().replace(' ','_')}_{data.market.lower()}"
    cached = db["insights_cache"].find_one({"type": cache_key}, {"_id": 0})
    if cached:
        return {"salary": cached["data"], "from_cache": True}

    currency_map = {
        "US": "USD ($)", "India": "INR (₹, in LPA — Lakhs Per Annum)",
        "UK": "GBP (£)", "Singapore": "SGD (S$)",
        "UAE": "AED (AED, note tax-free)", "Global": "USD ($) approximate global average"
    }
    currency = currency_map.get(data.market, "USD ($)")

    prompt = f"""You are a compensation expert. Provide salary benchmarks for: {data.role} in the {data.market} job market.
Currency: {currency}

Return ONLY JSON:
{{
  "role": "{data.role}",
  "market": "{data.market}",
  "currency_note": "<e.g. All figures in USD total comp>",
  "entry": {{"range": "<range>", "years_exp": "0–2 years", "note": "<1 sentence context>"}},
  "mid": {{"range": "<range>", "years_exp": "3–6 years", "note": "<1 sentence context>"}},
  "senior": {{"range": "<range>", "years_exp": "7+ years", "note": "<1 sentence context>"}},
  "top_paying_companies": ["<company 1>", "<company 2>", "<company 3>"],
  "salary_tip": "<1 actionable tip to negotiate or increase comp for this role>",
  "market_context": "<1–2 sentences about the hiring market for this role in this country>"
}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500, temperature=0.3,
    )
    result = safe_json(res.choices[0].message.content)
    db["insights_cache"].update_one(
        {"type": cache_key},
        {"$set": {"type": cache_key, "data": result, "cached_at": datetime.datetime.utcnow().isoformat()}},
        upsert=True
    )
    return {"salary": result, "from_cache": False}


# ── 7. Dynamic Skills for any role + market ───────────────────

class SkillsRequest(BaseModel):
    role:   str
    market: str = "Global"

@router.post("/skills")
def role_skills(data: SkillsRequest):
    cache_key = f"skills_{data.role.lower().strip().replace(' ','_')}_{data.market.lower()}"
    cached = db["insights_cache"].find_one({"type": cache_key}, {"_id": 0})
    if cached:
        return {"skills": cached["data"], "from_cache": True}

    prompt = f"""You are a hiring expert. List the most in-demand skills for: {data.role} in the {data.market} job market.

Return ONLY JSON:
{{
  "role": "{data.role}",
  "market": "{data.market}",
  "skills": [
    {{"skill": "<skill name>", "heat": <int 50-100>, "category": "technical|soft|domain", "why": "<1 sentence why this matters>"}},
    ... (return exactly 8 skills, sorted by heat descending)
  ],
  "certifications": ["<cert 1>", "<cert 2>", "<cert 3>"],
  "rising_skill": "<one emerging skill that is gaining traction>",
  "market_note": "<1 sentence about how {data.market} specifically values these skills>"
}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600, temperature=0.3,
    )
    result = safe_json(res.choices[0].message.content)
    db["insights_cache"].update_one(
        {"type": cache_key},
        {"$set": {"type": cache_key, "data": result, "cached_at": datetime.datetime.utcnow().isoformat()}},
        upsert=True
    )
    return {"skills": result, "from_cache": False}


# ── 8. Dynamic Top Employers for any role + market ────────────

class EmployersRequest(BaseModel):
    role:   str
    market: str = "Global"

@router.post("/employers")
def top_employers(data: EmployersRequest):
    cache_key = f"employers_{data.role.lower().strip().replace(' ','_')}_{data.market.lower()}"
    cached = db["insights_cache"].find_one({"type": cache_key}, {"_id": 0})
    if cached:
        return {"employers": cached["data"], "from_cache": True}

    prompt = f"""You are a hiring expert. List top employers hiring for: {data.role} in the {data.market} job market.

Return ONLY JSON:
{{
  "role": "{data.role}",
  "market": "{data.market}",
  "employers": [
    {{
      "name": "<company name>",
      "interview_style": "<brief description e.g. Case + Behavioural>",
      "rounds": <int>,
      "difficulty": "Accessible|Medium|Hard|Very Hard",
      "known_for": "<1 sentence what makes this employer's process distinctive>",
      "tip": "<1 sentence specific prep tip for this employer>"
    }}
  ],
  "hiring_note": "<1–2 sentences on the overall hiring landscape for this role in this market>"
}}
Return exactly 6 employers."""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=700, temperature=0.4,
    )
    result = safe_json(res.choices[0].message.content)
    db["insights_cache"].update_one(
        {"type": cache_key},
        {"$set": {"type": cache_key, "data": result, "cached_at": datetime.datetime.utcnow().isoformat()}},
        upsert=True
    )
    return {"employers": result, "from_cache": False}


# ── 9. Dynamic Hiring Calendar for any role + market ─────────

class CalendarRequest(BaseModel):
    role:   str
    market: str = "Global"

@router.post("/hiring-calendar")
def hiring_calendar(data: CalendarRequest):
    cache_key = f"calendar_{data.role.lower().strip().replace(' ','_')}_{data.market.lower()}"
    cached = db["insights_cache"].find_one({"type": cache_key}, {"_id": 0})
    if cached:
        return {"calendar": cached["data"], "from_cache": True}

    prompt = f"""You are a recruitment expert. Describe the hiring calendar and recruitment cycle for: {data.role} in the {data.market} job market.

Return ONLY JSON:
{{
  "role": "{data.role}",
  "market": "{data.market}",
  "application_window": "<e.g. October – December>",
  "peak_month": "<single month>",
  "cycle_type": "fixed|rolling|off-cycle",
  "timeline": [
    {{"phase": "<phase name>", "timing": "<when>", "action": "<what candidate should do>"}},
    ... (4–5 phases)
  ],
  "market_quirks": "<1–2 sentences on anything unique about how this role recruits in this market>",
  "prep_start": "<how many weeks before the deadline to start preparing>",
  "networking_tip": "<1 sentence on how to network for this role in this market>"
}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600, temperature=0.4,
    )
    result = safe_json(res.choices[0].message.content)
    db["insights_cache"].update_one(
        {"type": cache_key},
        {"$set": {"type": cache_key, "data": result, "cached_at": datetime.datetime.utcnow().isoformat()}},
        upsert=True
    )
    return {"calendar": result, "from_cache": False}