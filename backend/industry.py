from fastapi import APIRouter

router = APIRouter(prefix="/industry")

@router.get("/insights")
def industry_data():

    return [
        {
            "industry": "Technology",
            "average_salary": "$110,000",
            "job_openings": "120,000",
            "workforce_size": "4.5M",
            "number_of_companies": "50000",
            "growth_rate": "12%",
            "top_skills": ["Python", "Cloud", "AI"]
        },
        {
            "industry": "Finance",
            "average_salary": "$95,000",
            "job_openings": "70,000",
            "workforce_size": "3.2M",
            "number_of_companies": "30000",
            "growth_rate": "8%",
            "top_skills": ["Financial Modeling", "Excel", "Risk"]
        }
    ]