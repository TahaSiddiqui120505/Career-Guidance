from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import os, json, re, datetime
from dotenv import load_dotenv
from database import db

load_dotenv()

router = APIRouter(prefix="/interview", tags=["Interview"])
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


# ── Models ────────────────────────────────────────────────────

class GenerateQuestionsRequest(BaseModel):
    job_role:         str
    question_types:   List[str]
    difficulty:       str = "medium"
    num_questions:    int = 8
    job_description:  Optional[str] = None
    experience_level: Optional[str] = "mid"

class EvaluateAnswerRequest(BaseModel):
    job_role:        str
    question:        str
    q_type:          str
    answer:          str
    difficulty:      str = "medium"
    is_mcq:          bool = False
    correct_option:  Optional[str] = None
    chosen_option:   Optional[str] = None

class HintRequest(BaseModel):
    job_role:  str
    question:  str
    q_type:    str

class SessionSummaryRequest(BaseModel):
    job_role: str
    qa_pairs: List[dict]

class SaveSessionRequest(BaseModel):
    user_email:   str
    job_role:     str
    difficulty:   str
    num_questions: int
    overall_score: float
    readiness_percentage: int
    overall_verdict: str
    by_type:      dict
    qa_pairs:     List[dict]
    top_strengths: List[str]
    key_gaps:     List[str]


# ── Helpers ───────────────────────────────────────────────────

def safe_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise

def is_low_effort(answer: str) -> bool:
    a = answer.strip().lower()
    words = a.split()
    if len(words) < 5:
        return True
    unique = set(words)
    if len(unique) <= 2 and len(words) >= 3:
        return True
    non_alpha = sum(1 for c in a if not c.isalpha() and c not in " .,")
    if non_alpha > len(a) * 0.4:
        return True
    filler = ["blah", "test", "asdf", "qwerty", "hello", "hi", "ok", "idk", "dunno", "nothing", "something", "abc", "lol"]
    if all(w in filler for w in words[:5]):
        return True
    return False


# ── 1. Generate Questions ─────────────────────────────────────

@router.post("/generate-questions")
def generate_questions(data: GenerateQuestionsRequest):
    type_instructions = {
        "behavioural": "Behavioural STAR-method questions ('Tell me about a time...', 'Describe a situation where...')",
        "technical":   "Technical/domain-specific questions testing depth of knowledge, tools, frameworks, and analytical skills",
        "case":        "Case study / situational questions presenting a business problem to solve",
        "mcq":         "Multiple choice questions with exactly 4 options (A, B, C, D). Mark one correct answer.",
    }
    types_block = "\n".join([f"- {type_instructions[t]}" for t in data.question_types if t in type_instructions])
    jd_block    = f"\nJob Description Context:\n{data.job_description}" if data.job_description else ""

    prompt = f"""You are a senior interviewer at a top-tier firm hiring for: {data.job_role}
Experience level: {data.experience_level} | Difficulty: {data.difficulty}

Generate exactly {data.num_questions} interview questions. Mix these types:
{types_block}
{jd_block}

Return ONLY a JSON array. Each object must have:
- "question": full question text
- "type": one of "behavioural", "technical", "case", "mcq"
- "difficulty": "{data.difficulty}"
- "tip": 1-sentence hint on what the interviewer is looking for

For MCQ type, ALSO include:
- "options": object with keys "A", "B", "C", "D"
- "correct_option": the correct letter
- "explanation": 1-2 sentence explanation

Return ONLY the JSON array. No preamble."""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2500, temperature=0.7,
    )
    return {"questions": safe_json(res.choices[0].message.content)}


# ── 2. Evaluate Answer ────────────────────────────────────────

@router.post("/evaluate-answer")
def evaluate_answer(data: EvaluateAnswerRequest):
    if data.is_mcq:
        correct = (data.chosen_option or "").strip().upper() == (data.correct_option or "").strip().upper()
        return {"evaluation": {
            "score": 10 if correct else 0,
            "verdict": "Strong" if correct else "Weak",
            "strengths": ["Correct answer selected"] if correct else [],
            "improvements": [] if correct else ["Review the concept behind this question"],
            "ideal_points": [],
            "follow_up_question": None,
            "follow_up_tip": None,
            "is_correct": correct,
        }}

    if is_low_effort(data.answer):
        return {"evaluation": {
            "score": 1, "verdict": "Weak",
            "strengths": [],
            "improvements": ["Answer appears to be a placeholder — write a genuine response.", "Even a rough attempt scores better than no real content.", "Use specific examples, terminology, or frameworks."],
            "ideal_points": ["Provide a structured, relevant answer.", "Use specific examples and correct terminology.", "Demonstrate real understanding of the topic."],
            "follow_up_question": None, "follow_up_tip": None,
        }}

    type_rubric = {
        "behavioural": "Evaluate using STAR completeness. Penalise heavily for vague or generic answers with no concrete example.",
        "technical":   "Evaluate technical accuracy, depth, and use of correct terminology. Score low if generic.",
        "case":        "Evaluate structured thinking, business logic, hypothesis formation. Penalise unstructured rambling.",
    }
    rubric = type_rubric.get(data.q_type, "Evaluate clarity, relevance, depth, and use of examples.")

    prompt = f"""You are a STRICT senior interviewer for: {data.job_role}
Question type: {data.q_type} | Difficulty: {data.difficulty}

SCORING RULES:
- 9-10: Exceptional — covers all key points with specific examples and insight
- 7-8: Good — solid with minor gaps
- 5-6: Adequate — misses important aspects or lacks specifics
- 3-4: Weak — vague, generic, or mostly irrelevant
- 1-2: Very poor — barely related, very short, shows no understanding
- NEVER score above 4 if answer is under 15 words
- NEVER score above 6 if no specific examples or terminology

Question: {data.question}
Answer: {data.answer}
Rubric: {rubric}

Return ONLY JSON:
{{"score":<int 1-10>,"verdict":"Strong|Good|Needs Work|Weak","strengths":[2-3 strings],"improvements":[2-3 strings],"ideal_points":[3-4 strings],"follow_up_question":"<string>","follow_up_tip":"<string>"}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800, temperature=0.3,
    )
    return {"evaluation": safe_json(res.choices[0].message.content)}


# ── 3. Hint ───────────────────────────────────────────────────

@router.post("/get-hint")
def get_hint(data: HintRequest):
    prompt = f"""Interview coach for: {data.job_role}
Stuck on this {data.q_type} question: "{data.question}"

Give a 2-3 sentence hint that nudges without giving the answer.
Return ONLY JSON: {{"hint":"...","framework":"STAR/DCF/MECE/null"}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200, temperature=0.5,
    )
    return safe_json(res.choices[0].message.content)


# ── 4. Session Summary ────────────────────────────────────────

@router.post("/session-summary")
def session_summary(data: SessionSummaryRequest):
    qa_text = "\n\n".join([
        f"Q{i+1} [{p.get('q_type','').upper()}] {p.get('question','')}\nAnswer: {p.get('answer','')}\nScore: {p.get('score','N/A')}/10"
        for i, p in enumerate(data.qa_pairs)
    ])
    scores = [p.get("score", 0) for p in data.qa_pairs if isinstance(p.get("score"), (int, float))]
    avg    = round(sum(scores) / len(scores), 1) if scores else 0

    prompt = f"""Senior interview coach reviewing a mock interview for: {data.job_role}
Session:
{qa_text}
Average: {avg}/10

Return ONLY JSON:
{{"overall_score":{avg},"overall_verdict":"Outstanding|Strong|Competent|Needs Improvement|Not Ready","overall_summary":"<2-3 sentences>","top_strengths":[3 strings],"key_gaps":[3 strings],"recommended_actions":[3 strings],"readiness_percentage":<int 0-100>,"by_type":{{"behavioural":{{"avg_score":<float>,"comment":"<1 sentence>"}},"technical":{{"avg_score":<float>,"comment":"<1 sentence>"}},"case":{{"avg_score":<float>,"comment":"<1 sentence>"}},"mcq":{{"avg_score":<float>,"comment":"<1 sentence>"}}}}}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=900, temperature=0.4,
    )
    return {"summary": safe_json(res.choices[0].message.content)}


# ── 5. Save Session ───────────────────────────────────────────

@router.post("/save-session")
def save_session(data: SaveSessionRequest):
    session = {
        **data.dict(),
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    db["interview_sessions"].insert_one(session)
    return {"saved": True}


# ── 6. Get Session History ────────────────────────────────────

@router.get("/history/{user_email}")
def get_history(user_email: str):
    sessions = list(
        db["interview_sessions"]
        .find({"user_email": user_email}, {"_id": 0})
        .sort("created_at", -1)
        .limit(20)
    )
    return {"sessions": sessions}


# ── 7. Devil's Advocate ────────────────────────────────────────

class DevilRequest(BaseModel):
    job_role:   str
    question:   str
    answer:     str
    q_type:     str
    round:      int = 1   # 1 = first challenge, 2 = second escalation

@router.post("/devils-advocate")
def devils_advocate(data: DevilRequest):

    intensity = [
        "Politely but firmly challenge one key assumption in their answer.",
        "Push back harder — find a flaw, an edge case, or a counter-example they missed.",
        "Be aggressive — challenge the entire approach and suggest a completely different framing.",
    ]
    level = intensity[min(data.round - 1, 2)]

    prompt = f"""You are a tough, skeptical senior interviewer at a top firm hiring for: {data.job_role}

The candidate just answered a {data.q_type} question.

Question: {data.question}
Their Answer: {data.answer}

Your job: {level}

Rules:
- Ask ONE sharp follow-up challenge question (not multiple)
- Be direct and confident, like a real interviewer
- Don't be cruel or personal — just intellectually tough
- The challenge should make them think harder, not just repeat themselves
- Keep it under 3 sentences

Return ONLY JSON:
{{"challenge": "<your sharp follow-up challenge>", "angle": "<one word: assumption/evidence/alternative/edge-case/logic>"}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=250, temperature=0.6,
    )
    return safe_json(res.choices[0].message.content)


# ── 8. Resume Gap Detector ─────────────────────────────────────

class ResumeGapRequest(BaseModel):
    resume_text: str
    job_role:    str
    difficulty:  str = "medium"

@router.post("/resume-gaps")
def resume_gaps(data: ResumeGapRequest):
    if len(data.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")

    prompt = f"""You are a senior hiring manager reviewing a resume for: {data.job_role}

Resume:
{data.resume_text[:3000]}

Analyse this resume and identify:
1. The 4 biggest weaknesses or gaps an interviewer will probe
2. For each gap, generate 2 hard interview questions they'll likely ask
3. One tip to address each gap before the interview

Return ONLY JSON:
{{
  "candidate_summary": "<2 sentence summary of their profile>",
  "gaps": [
    {{
      "gap": "<gap title>",
      "severity": "high|medium|low",
      "explanation": "<why this is a red flag>",
      "questions": ["<hard Q1>", "<hard Q2>"],
      "tip": "<how to address this>"
    }}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "overall_readiness": <int 0-100>
}}"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1200, temperature=0.4,
    )
    return {"analysis": safe_json(res.choices[0].message.content)}