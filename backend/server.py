from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from auth         import router as auth_router
from resume       import router as resume_router
from cover_letter import router as cover_letter_router
from interview    import router as interview_router
from insights     import router as insights_router
from adaptive     import router as adaptive_router

load_dotenv()

app = FastAPI(title="SensAI API", version="2.0.0")

# Read allowed origins from env, fallback to allow all in dev
raw_origins = os.getenv("CORS_ORIGINS", "*")
if raw_origins == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)