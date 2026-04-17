# from fastapi import APIRouter, HTTPException
# from passlib.hash import bcrypt
# from jose import jwt
# from datetime import datetime, timedelta
# from database import users_collection
# from models import UserRegister, UserLogin

# SECRET = "sensai-super-secret-key"

# router = APIRouter(prefix="/auth", tags=["Auth"])


# def create_token(user_id):
#     payload = {
#         "user_id": str(user_id),
#         "exp": datetime.utcnow() + timedelta(days=7)
#     }
#     token = jwt.encode(payload, SECRET, algorithm="HS256")
#     return token


# @router.post("/register")
# async def register(user: UserRegister):

#     existing = users_collection.find_one({"email": user.email})

#     if existing:
#         raise HTTPException(status_code=400, detail="User already exists")

#     hashed_password = bcrypt.hash(user.password)

#     result = users_collection.insert_one({
#         "name": user.name,
#         "email": user.email,
#         "password": hashed_password
#     })

#     token = create_token(result.inserted_id)

#     return {
#         "token": token,
#         "user": {
#             "name": user.name,
#             "email": user.email
#         }
#     }


# @router.post("/login")
# async def login(user: UserLogin):

#     db_user = users_collection.find_one({"email": user.email})

#     if not db_user:
#         raise HTTPException(status_code=404, detail="User not found")

#     if not bcrypt.verify(user.password, db_user["password"]):
#         raise HTTPException(status_code=401, detail="Incorrect password")

#     token = create_token(db_user["_id"])

#     # ── Now returns user name so the Dashboard can greet the user ──
#     return {
#         "token": token,
#         "user": {
#             "name": db_user.get("name", ""),
#             "email": db_user.get("email", "")
#         }
#     }

from fastapi import APIRouter, HTTPException
from passlib.hash import pbkdf2_sha256 as hasher
from jose import jwt
from datetime import datetime, timedelta
from database import users_collection
from models import UserRegister, UserLogin
import os
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("SECRET", "fallback-secret-change-me")

router = APIRouter(prefix="/auth", tags=["Auth"])


def create_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, SECRET, algorithm="HS256")
    return token


@router.post("/register")
async def register(user: UserRegister):
    print(f"Attempting to register user with email: {user.email}")

    existing = users_collection.find_one({"email": user.email})
    print(f"Existing user check result: {existing}")

    if existing:
        print("User already exists, raising exception")
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hasher.hash(user.password)

    result = users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed_password
    })

    token = create_token(result.inserted_id)

    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": user.email
        }
    }


@router.post("/login")
async def login(user: UserLogin):

    db_user = users_collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not hasher.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_token(db_user["_id"])

    # ── Now returns user name so the Dashboard can greet the user ──
    return {
        "token": token,
        "user": {
            "name": db_user.get("name", ""),
            "email": db_user.get("email", "")
        }
    }