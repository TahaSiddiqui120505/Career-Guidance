from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, json, re
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
from database import db

load_dotenv()

router = APIRouter(prefix="/adaptive", tags=["Adaptive Learning"])
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

# ── MongoDB collections ──────────────────────────────────────────
adaptive_profiles_col = db["adaptive_profiles"]
adaptive_sessions_col  = db["adaptive_sessions"]

# ── Pydantic models ──────────────────────────────────────────────

class DiagnosticGenerateRequest(BaseModel):
    user_email:       str
    job_role:         str
    company:          str
    experience_level: str = "mid"

class DiagnosticEvaluateRequest(BaseModel):
    user_email:       str
    job_role:         str
    company:          str
    experience_level: str = "mid"
    qa_pairs:         List[Dict[str, Any]]

class NotesGenerateRequest(BaseModel):
    user_email: str
    topic:      str
    job_role:   str
    company:    str
    level:      str = "medium"

class TestGenerateRequest(BaseModel):
    user_email:    str
    topic:         str
    job_role:      str
    company:       str
    num_questions: int = 5

class TestEvaluateRequest(BaseModel):
    user_email: str
    topic:      str
    job_role:   str
    qa_pairs:   List[Dict[str, Any]]

# ── Helpers ──────────────────────────────────────────────────────

def safe_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise

def _call_groq(prompt: str, max_tokens: int = 3000, temperature: float = 0.5) -> str:
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return res.choices[0].message.content

def _get_profile_doc(user_email: str, job_role: str, company: str):
    return adaptive_profiles_col.find_one(
        {"user_email": user_email, "job_role": job_role, "company": company},
        {"_id": 0}
    )

def _save_profile(user_email: str, job_role: str, company: str, data: dict):
    adaptive_profiles_col.update_one(
        {"user_email": user_email, "job_role": job_role, "company": company},
        {"$set": {**data, "last_updated": datetime.utcnow().isoformat()}},
        upsert=True
    )

# ── Routes ───────────────────────────────────────────────────────

@router.post("/diagnostic/generate")
def generate_diagnostic(req: DiagnosticGenerateRequest):
    prompt = f"""You are a senior interview coach generating a diagnostic test.

Create an 8-question diagnostic interview test for:
- Job Role: {req.job_role}
- Company: {req.company}
- Experience Level: {req.experience_level}

Return ONLY valid JSON in this exact structure:
{{
  "test_title": "Diagnostic Test: {req.job_role} at {req.company}",
  "instructions": "Answer every question honestly. This helps us identify your gaps and build your personalised prep plan.",
  "competency_areas": ["area1", "area2", "area3", "area4"],
  "questions": [
    {{
      "id": 1,
      "q_type": "behavioural",
      "question": "full question text",
      "tip": "short answering tip",
      "time_hint": "3-4 minutes",
      "options": null,
      "correct_option": null
    }}
  ]
}}

Rules:
- Exactly 8 questions: 2 behavioural, 2 technical, 2 case, 2 mcq
- For mcq questions set options to {{"A":"text","B":"text","C":"text","D":"text"}} and correct_option to the correct letter
- For non-mcq questions set options to null and correct_option to null
- Make questions highly specific to {req.job_role} at {req.company}
- Return ONLY the JSON, no explanation, no markdown"""

    raw  = _call_groq(prompt, max_tokens=2500, temperature=0.7)
    data = safe_json(raw)
    return {"diagnostic": data}


@router.post("/diagnostic/evaluate")
def evaluate_diagnostic(req: DiagnosticEvaluateRequest):
    qa_block = "\n\n".join(
        f"Q{i+1} [{qa['q_type']}]: {qa['question']}\nAnswer: {qa['answer']}"
        for i, qa in enumerate(req.qa_pairs)
    )

    prompt = f"""You are an expert interview coach evaluating a diagnostic test.

Candidate is applying for: {req.job_role} at {req.company} ({req.experience_level} level)

Their answers:
{qa_block}

Analyse their performance and return ONLY valid JSON in this exact structure:
{{
  "overall_score": <integer 0-100>,
  "readiness_level": "Needs Work",
  "personalised_message": "2-3 sentence personal feedback addressing the candidate directly",
  "interview_date_recommendation": "e.g. You need at least 2 weeks of focused prep before interviewing",
  "strong_areas": ["area1", "area2"],
  "critical_gaps": ["gap1", "gap2", "gap3"],
  "learning_topics": [
    {{
      "topic": "Topic Name",
      "priority": "critical",
      "reason": "Why this matters for the role in 1 sentence",
      "resources": ["resource type 1", "resource type 2"]
    }}
  ]
}}

Rules:
- readiness_level must be one of: Needs Work, Developing, Competent, Strong, Interview Ready
- learning_topics: 4-7 topics ordered by priority (critical first)
- priority must be one of: critical, high, medium
- Topics must be specific to {req.job_role} at {req.company}
- Return ONLY the JSON, no explanation"""

    raw          = _call_groq(prompt, max_tokens=2000, temperature=0.4)
    profile_data = safe_json(raw)

    # Build topic_progress scaffold
    topic_progress = {}
    for t in profile_data.get("learning_topics", []):
        topic_progress[t["topic"]] = {
            "priority":        t["priority"],
            "progress":        0,
            "tests_taken":     0,
            "notes_generated": False,
        }

    _save_profile(req.user_email, req.job_role, req.company, {
        "profile":          profile_data,
        "topic_progress":   topic_progress,
        "job_role":         req.job_role,
        "company":          req.company,
        "experience_level": req.experience_level,
    })

    return {"profile": profile_data, "topic_progress": topic_progress}


@router.post("/notes/generate")
def generate_notes(req: NotesGenerateRequest):
    prompt = f"""You are an expert interview coach creating personalised study notes.

Create detailed interview prep notes for:
- Topic: {req.topic}
- Job Role: {req.job_role}
- Company: {req.company}
- Difficulty Level: {req.level}

Return ONLY valid JSON in this exact structure:
{{
  "topic": "{req.topic}",
  "summary": "2-3 sentence overview of this topic",
  "why_it_matters": "Why interviewers at {req.company} test this for {req.job_role} in 1-2 sentences",
  "estimated_study_time": "45 minutes",
  "difficulty_rating": 3,
  "key_concepts": [
    {{
      "concept": "Concept Name",
      "explanation": "Clear explanation in 3-4 sentences",
      "example": "Concrete example relevant to {req.job_role} at {req.company}"
    }}
  ],
  "interview_angles": ["How interviewers test angle 1", "angle 2", "angle 3"],
  "quick_tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "common_mistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
  "practice_prompt": "A realistic practice question testing this topic"
}}

Rules:
- 3-5 key_concepts
- difficulty_rating is integer 1-5
- Everything specific to {req.job_role} at {req.company}
- Return ONLY the JSON, no explanation"""

    raw   = _call_groq(prompt, max_tokens=2500, temperature=0.5)
    notes = safe_json(raw)

    # Mark notes as generated
    doc = _get_profile_doc(req.user_email, req.job_role, req.company)
    if doc:
        tp = doc.get("topic_progress", {})
        if req.topic in tp:
            tp[req.topic]["notes_generated"] = True
            _save_profile(req.user_email, req.job_role, req.company, {"topic_progress": tp})

    return {"notes": notes}


@router.post("/test/generate")
def generate_topic_test(req: TestGenerateRequest):
    prompt = f"""You are an expert interview coach generating a focused topic test.

Generate a {req.num_questions}-question test on the topic "{req.topic}" for:
- Job Role: {req.job_role}
- Company: {req.company}

Return ONLY valid JSON in this exact structure:
{{
  "topic": "{req.topic}",
  "time_limit_minutes": 15,
  "total_marks": 20,
  "passing_score": 12,
  "questions": [
    {{
      "id": 1,
      "q_type": "mcq",
      "question": "question text",
      "marks": 4,
      "options": {{"A": "text", "B": "text", "C": "text", "D": "text"}},
      "correct_option": "A",
      "explanation": "Why A is correct"
    }}
  ]
}}

Rules:
- {req.num_questions} questions: roughly 60% mcq, 40% open-ended (short_answer or behavioural)
- For open-ended questions set options and correct_option and explanation to null
- For mcq include all 4 options, correct_option letter, and explanation
- total_marks = sum of all question marks
- passing_score = 60% of total_marks (rounded)
- Questions must directly test "{req.topic}" in context of {req.job_role}
- Return ONLY the JSON, no explanation"""

    raw  = _call_groq(prompt, max_tokens=2000, temperature=0.6)
    test = safe_json(raw)
    return {"test": test}


@router.post("/test/evaluate")
def evaluate_topic_test(req: TestEvaluateRequest):
    qa_block = "\n\n".join(
        f"Q{i+1} [{qa['q_type']}]: {qa['question']}\nAnswer: {qa.get('answer') or qa.get('chosen', '')}"
        for i, qa in enumerate(req.qa_pairs)
    )

    prompt = f"""You are a strict interview evaluator marking a topic test.

Topic: {req.topic}
Job Role: {req.job_role}
Candidate answers:
{qa_block}

Evaluate and return ONLY valid JSON in this exact structure:
{{
  "score": <integer 0-100>,
  "passed": <true or false>,
  "verdict": "short verdict e.g. Good Understanding / Needs More Work",
  "topic_mastery": <integer 0-100>,
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "next_action": "Specific actionable next step the candidate should take"
}}

Rules:
- passed = true if score >= 60
- topic_mastery reflects depth of understanding (can differ slightly from score)
- next_action must be concrete and address the specific gaps found
- Return ONLY the JSON, no explanation"""

    raw    = _call_groq(prompt, max_tokens=1000, temperature=0.3)
    result = safe_json(raw)

    # Update topic progress in MongoDB using weighted average
    doc = adaptive_profiles_col.find_one(
        {"user_email": req.user_email, "job_role": req.job_role},
        {"_id": 0}
    )
    if doc:
        tp = doc.get("topic_progress", {})
        if req.topic in tp:
            old_mastery = tp[req.topic].get("progress", 0)
            new_mastery = round(old_mastery * 0.4 + result["topic_mastery"] * 0.6)
            tp[req.topic]["progress"]    = new_mastery
            tp[req.topic]["tests_taken"] = tp[req.topic].get("tests_taken", 0) + 1
            adaptive_profiles_col.update_one(
                {"user_email": req.user_email, "job_role": req.job_role},
                {"$set": {"topic_progress": tp, "last_updated": datetime.utcnow().isoformat()}}
            )

    # Log session
    adaptive_sessions_col.insert_one({
        "user_email":    req.user_email,
        "job_role":      req.job_role,
        "topic":         req.topic,
        "score":         result["score"],
        "topic_mastery": result["topic_mastery"],
        "passed":        result["passed"],
        "timestamp":     datetime.utcnow().isoformat(),
    })

    return {"result": result}


@router.get("/profiles/{user_email}")
def get_all_profiles(user_email: str):
    docs = list(adaptive_profiles_col.find({"user_email": user_email}, {"_id": 0}))
    return {"profiles": docs}


@router.get("/profile/{user_email}/{job_role}/{company}")
def get_profile(user_email: str, job_role: str, company: str):
    doc = adaptive_profiles_col.find_one(
        {"user_email": user_email, "job_role": job_role, "company": company},
        {"_id": 0}
    )
    return {"profile": doc}