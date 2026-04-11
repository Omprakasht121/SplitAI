from sqlalchemy.orm import Session
from . import models
import bcrypt
import uuid
from datetime import datetime

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: dict):
    hashed_password = get_password_hash(user["password"])
    db_user = models.User(email=user["email"], name=user["name"], hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_project(db: Session, user_id: int, name: str, website_type: str = "default", prompt: str = None, design_image: str = None, description: str = None):
    project_id = str(uuid.uuid4())
    db_project = models.Project(
        id=project_id, 
        name=name, 
        user_id=user_id, 
        website_type=website_type,
        prompt=prompt,
        description=description,
        design_image_b64=design_image
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_metadata(db: Session, project_id: str, plan_json: str = None, prompt: str = None, design_image: str = None):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        if plan_json: db_project.plan_json = plan_json
        if prompt: db_project.prompt = prompt
        if design_image: db_project.design_image_b64 = design_image
        db.commit()
        db.refresh(db_project)
    return db_project

def get_user_projects(db: Session, user_id: int):
    return db.query(models.Project).filter(models.Project.user_id == user_id).order_by(models.Project.updated_at.desc()).all()

def get_project(db: Session, project_id: str):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def update_project(db: Session, project_id: str, **kwargs):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        for key, value in kwargs.items():
            if hasattr(db_project, key):
                setattr(db_project, key, value)
        db_project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: str):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False

def save_file(db: Session, project_id: str, filename: str, content: str):
    db_file = db.query(models.File).filter(models.File.project_id == project_id, models.File.filename == filename).first()
    if db_file:
        db_file.content = content
    else:
        db_file = models.File(project_id=project_id, filename=filename, content=content)
        db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def get_project_files(db: Session, project_id: str):
    return db.query(models.File).filter(models.File.project_id == project_id).all()

def get_preview_files(db: Session, project_id: str):
    """Fetch only files needed for the visual preview"""
    return db.query(models.File).filter(
        models.File.project_id == project_id,
        models.File.filename.in_(["index.html", "style.css", "script.js"])
    ).all()

def delete_file(db: Session, project_id: str, filename: str) -> bool:
    db_file = db.query(models.File).filter(
        models.File.project_id == project_id,
        models.File.filename == filename
    ).first()
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False
