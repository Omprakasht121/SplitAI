from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import io
import zipfile
import jwt

from db import crud, models, database
from routers.auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Dependency to get current user ID from token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class ProjectCreate(BaseModel):
    name: str
    website_type: str = "default"
    prompt: str | None = None
    description: str | None = None
    design_image: str | None = None

class FileUpdate(BaseModel):
    content: str

@router.get("")
def list_projects(user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    projects = crud.get_user_projects(db, user_id=user_id)
    return [
        {
            "id": p.id,
            "name": p.name,
            "website_type": p.website_type,
            "description": p.description,
            "updated_at": p.updated_at.isoformat(),
            "first_letter": p.name[0].upper() if p.name else "P"
        } for p in projects
    ]

@router.post("")
def create_project(project: ProjectCreate, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.create_project(
        db, 
        user_id=user_id, 
        name=project.name, 
        website_type=project.website_type,
        prompt=project.prompt,
        description=project.description,
        design_image=project.design_image
    )
    return {"id": db_proj.id, "name": db_proj.name}

@router.get("/{project_id}")
def get_project_details(project_id: str, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj or db_proj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    files = crud.get_project_files(db, project_id=project_id)
    files_map = {f.filename: f.content for f in files}
    return {
        "id": db_proj.id,
        "name": db_proj.name,
        "website_type": db_proj.website_type,
        "description": db_proj.description,
        "prompt": db_proj.prompt,
        "design_image": db_proj.design_image_b64,
        "plan_json": db_proj.plan_json,
        "files": files_map
    }

@router.get("/{project_id}/preview")
def get_project_preview(project_id: str, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj or db_proj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    files = crud.get_preview_files(db, project_id=project_id)
    files_map = {f.filename: f.content for f in files}
    
    return {
        "id": db_proj.id,
        "html": files_map.get("index.html", ""),
        "css": files_map.get("style.css", ""),
        "js": files_map.get("script.js", "")
    }

@router.put("/{project_id}/files/{filename:path}")
def update_project_file(project_id: str, filename: str, file_data: FileUpdate, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj or db_proj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    crud.save_file(db, project_id=project_id, filename=filename, content=file_data.content)
    # Update project updated_at timestamp
    db_proj.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success"}

@router.delete("/{project_id}/files/{filename:path}")
def delete_project_file(project_id: str, filename: str, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj or db_proj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deleted = crud.delete_file(db, project_id=project_id, filename=filename)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Update project updated_at timestamp
    db_proj.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "deleted", "filename": filename}

@router.get("/{project_id}/download")
def download_project(project_id: str, db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    files = crud.get_project_files(db, project_id=project_id)
    
    # Create zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for f in files:
            zip_file.writestr(f.filename, f.content)
            
    zip_buffer.seek(0)
    
    response = StreamingResponse(zip_buffer, media_type="application/x-zip-compressed")
    response.headers["Content-Disposition"] = f"attachment; filename={db_proj.name.replace(' ', '_')}.zip"
    return response

@router.patch("/{project_id}")
def update_project(project_id: str, data: Dict[str, Any], user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj or db_proj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    updated = crud.update_project(db, project_id=project_id, **data)
    return {"status": "success", "id": updated.id, "name": updated.name}

@router.delete("/{project_id}")
def delete_project(project_id: str, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_proj = crud.get_project(db, project_id=project_id)
    if not db_proj or db_proj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    crud.delete_project(db, project_id=project_id)
    return {"status": "success", "message": "Project deleted"}

class BulkDeleteRequest(BaseModel):
    project_ids: List[str]

@router.post("/bulk-delete")
def bulk_delete_projects(request: BulkDeleteRequest, user_id: int = Depends(get_current_user), db: Session = Depends(database.get_db)):
    deleted_count = 0
    for pid in request.project_ids:
        db_proj = crud.get_project(db, project_id=pid)
        if db_proj and db_proj.user_id == user_id:
            crud.delete_project(db, project_id=pid)
            deleted_count += 1
            
    return {"status": "success", "deleted_count": deleted_count}
