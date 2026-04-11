from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
from typing import List
import os, json, re
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/resume", tags=["Resume"])

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


class ResumeRequest(BaseModel):
    name: str
    email: str
    degree: str
    summary: str
    skills: str
    experience: str
    projects: List[str]


def safe_json(text: str):
    """Strip markdown fences and parse JSON safely."""
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"(\{.*\})", text, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise


@router.post("/generate")
async def generate_resume(data: ResumeRequest):
    prompt = f"""
Create a professional resume.

Name: {data.name}
Email: {data.email}
Degree: {data.degree}

Professional Summary:
{data.summary}

Experience:
{data.experience}

Skills:
{data.skills}

Projects:
{", ".join(data.projects)}

Format it professionally.
"""
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return {"resume": completion.choices[0].message.content}


@router.post("/enhance")
async def enhance_resume(data: ResumeRequest):
    prompt = f"""You are a professional resume writer. Rewrite the content below into strong, concise, impactful resume language.

Rules:
- Convert every sentence into a strong action-verb bullet point
- Quantify achievements where possible (add realistic numbers/percentages)
- Use professional vocabulary specific to the role/industry
- Summary should be 2-3 tight sentences max
- Skills should be grouped and comma-separated per line
- Each project should be one impactful sentence
- Return ONLY valid JSON, no markdown, no explanation

Return exactly this JSON structure:
{{
  "summary": "improved summary text here",
  "experience": "bullet 1\\nbullet 2\\nbullet 3",
  "skills": "skill group 1\\nskill group 2",
  "projects": ["improved project 1", "improved project 2"]
}}

Content to improve:

SUMMARY:
{data.summary or "Not provided"}

EXPERIENCE:
{data.experience or "Not provided"}

SKILLS:
{data.skills or "Not provided"}

PROJECTS:
{chr(10).join(data.projects) if data.projects else "Not provided"}
"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.4,
    )

    raw = completion.choices[0].message.content
    try:
        result = safe_json(raw)
        # Ensure projects is always a list
        if isinstance(result.get("projects"), str):
            result["projects"] = [p.strip() for p in result["projects"].split("\n") if p.strip()]
        return result
    except Exception as e:
        return {"error": f"AI formatting failed: {str(e)}", "raw": raw}


@router.post("/score")
async def score_resume(data: ResumeRequest):
    """Score the resume and give improvement tips."""
    prompt = f"""You are a strict ATS system and senior recruiter. Score this resume and give feedback.

Name: {data.name}
Degree: {data.degree}
Summary: {data.summary}
Experience: {data.experience}
Skills: {data.skills}
Projects: {", ".join(data.projects)}

Return ONLY valid JSON:
{{
  "overall_score": <integer 0-100>,
  "ats_score": <integer 0-100>,
  "sections": {{
    "summary":    {{"score": <0-100>, "feedback": "one sentence"}},
    "experience": {{"score": <0-100>, "feedback": "one sentence"}},
    "skills":     {{"score": <0-100>, "feedback": "one sentence"}},
    "projects":   {{"score": <0-100>, "feedback": "one sentence"}}
  }},
  "top_issues": ["issue 1", "issue 2", "issue 3"],
  "quick_wins": ["quick fix 1", "quick fix 2", "quick fix 3"]
}}"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.3,
    )
    try:
        return safe_json(completion.choices[0].message.content)
    except:
        return {"error": "Scoring failed"}