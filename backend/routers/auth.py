from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import jwt
import os
from pydantic import BaseModel

from db import crud, models, database

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    # In production, this should cause an application crash or at least a severe warning.
    # For now, we use a development-only placeholder to prevent unintended access.
    SECRET_KEY = "dev-mode-insecure-secret-key-replace-in-production"
    import logging
    logging.warning("JWT_SECRET not found in environment. Using INSECURE development key.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = crud.create_user(db, user.model_dump())
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "id": new_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_name": new_user.name, "user_email": new_user.email}

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not crud.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "id": db_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_name": db_user.name, "user_email": db_user.email}
