from fastapi import APIRouter
from groq import Groq
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


# ── Expanded request model (defined here to avoid models.py conflict) ──
class CoverLetterRequestV2(BaseModel):
    # Candidate info
    full_name:       Optional[str] = None
    email:           Optional[str] = None
    phone:           Optional[str] = None
    linkedin:        Optional[str] = None
    # Role info
    job_role:        str
    company_name:    Optional[str] = None
    industry:        str
    hiring_manager:  Optional[str] = None
    job_description: Optional[str] = None
    # Candidate content
    user_background: Optional[str] = None
    key_achievement: Optional[str] = None
    # Style
    tone:            Optional[str] = "professional"
    letter_style:    Optional[str] = "modern"


TONE_INSTRUCTIONS = {
    "professional":  "Use a formal, polished, and measured tone. Precise word choice. Avoid slang.",
    "confident":     "Use a bold, direct, assertive tone. Strong verbs. No hedging language.",
    "enthusiastic":  "Use an energetic, genuinely excited tone. Show passion for the company and role.",
    "concise":       "Be extremely concise — maximum 200 words total. Every sentence must earn its place.",
    "creative":      "Open with a compelling story or hook. Use vivid language. Make it memorable.",
}


@router.post("/generate")
def generate_cover_letter(data: CoverLetterRequestV2):

    company      = data.company_name    or "the company"
    manager      = data.hiring_manager  or "Hiring Manager"
    tone_instr   = TONE_INSTRUCTIONS.get(data.tone, TONE_INSTRUCTIONS["professional"])

    jd_block  = f"\nJob Description to tailor the letter to:\n{data.job_description}\n" if data.job_description else ""
    bg_block  = f"\nCandidate Background:\n{data.user_background}\n"                    if data.user_background else ""
    ach_block = f"\nKey Achievement to highlight:\n{data.key_achievement}\n"            if data.key_achievement else ""

    prompt = f"""You are an expert cover letter writer used by top career coaches worldwide.

TONE INSTRUCTION: {tone_instr}

Write a cover letter for the following application. Output ONLY the letter body — 
no subject line, no commentary, no preamble, no markdown formatting.

STRICT RULES:
1. Open with a compelling hook — NOT "I am writing to express my interest"
2. Salutation: "Dear {manager},"
3. Structure: Hook opening → Why this company specifically → What you bring (use the achievement) → Strong closing CTA
4. Reference {company} naturally by name at least twice
5. Sign off with "Sincerely," followed by a blank line (the candidate will add their name)
6. Do NOT write the candidate's name or contact info — that goes in the header separately
7. No bullet points — flowing prose paragraphs only

Application Details:
- Candidate Name: {data.full_name or "the candidate"}
- Job Role: {data.job_role}
- Company: {company}
- Industry: {data.industry}
{jd_block}{bg_block}{ach_block}"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.7,
    )

    content = completion.choices[0].message.content.strip()
    return {"content": content}