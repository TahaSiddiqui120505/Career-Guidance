from pydantic import BaseModel
from typing import List, Optional


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


# ---------- Resume Builder ----------

class ResumeRequest(BaseModel):
    name: str
    email: str
    degree: str
    summary: str
    skills: str
    experience: str
    projects: List[str]


# ---------- Old Resume Structure ----------

class Resume(BaseModel):
    personal_info: dict
    education: List[dict]
    experience: List[dict]
    skills: List[str]
    template_id: str


# ---------- Cover Letter ----------

class CoverLetterRequest(BaseModel):
    industry: str
    job_role: str
    company_name:    Optional[str] = None
    job_description: Optional[str] = None
    user_background: Optional[str] = None


# ---------- Interview ----------

class GenerateQuestionsRequest(BaseModel):
    job_role:         str
    question_types:   List[str]
    difficulty:       str = "medium"
    num_questions:    int = 8
    job_description:  Optional[str] = None
    experience_level: Optional[str] = "mid"

class EvaluateAnswerRequest(BaseModel):
    job_role:   str
    question:   str
    q_type:     str
    answer:     str
    difficulty: str = "medium"

class HintRequest(BaseModel):
    job_role:  str
    question:  str
    q_type:    str

class SessionSummaryRequest(BaseModel):
    job_role: str
    qa_pairs: List[dict]