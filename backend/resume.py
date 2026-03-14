from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
from typing import List
import os
from dotenv import load_dotenv
import json

load_dotenv()

router = APIRouter(prefix="/resume", tags=["Resume"])

# secure API key
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


class ResumeRequest(BaseModel):
    name: str
    email: str
    degree: str
    summary: str
    skills: str
    experience: str
    projects: List[str]


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

    return {
        "resume": completion.choices[0].message.content
    }


# NEW AI ENHANCEMENT ROUTE
@router.post("/enhance")
async def enhance_resume(data: ResumeRequest):

    prompt = f"""
Rewrite this resume content professionally.

Convert sentences into strong resume bullet points.

Return JSON format only like this:

{{
"summary":"",
"experience":"",
"skills":"",
"projects":[]
}}

Summary:
{data.summary}

Experience:
{data.experience}

Skills:
{data.skills}

Projects:
{data.projects}
"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    response = completion.choices[0].message.content

    try:
        return json.loads(response)
    except:
        return {"error": "AI formatting failed"}