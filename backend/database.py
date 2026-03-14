from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

# fallback safety
if DB_NAME is None:
    DB_NAME = "sensai"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

users_collection = db["users"]
resumes_collection = db["resumes"]
cover_letters_collection = db["cover_letters"]