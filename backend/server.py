from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth         import router as auth_router
from resume       import router as resume_router
from cover_letter import router as cover_letter_router
from interview    import router as interview_router
from insights     import router as insights_router
from adaptive     import router as adaptive_router

app = FastAPI(title="SensAI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "SensAI API Running ✓"}

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(cover_letter_router)
app.include_router(interview_router)
app.include_router(insights_router)
app.include_router(adaptive_router)