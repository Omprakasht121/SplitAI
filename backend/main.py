"""
Split AI Backend - FastAPI Application
Voice-driven website builder API with SSE streaming
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import json
import asyncio
import os
from pathlib import Path

from generators.mvp_generator import MVPGenerator
from preview.server import PreviewServer
from dotenv import load_dotenv
from db import models, database
from routers import auth, projects
from fastapi.staticfiles import StaticFiles

load_dotenv()

# Initialize DB
models.Base.metadata.create_all(bind=database.engine)

# Initialize FastAPI app
app = FastAPI(
    title="Split AI",
    description="Voice-driven AI website builder backend",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(projects.router)

# Configure CORS for frontend communication
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
if raw_origins == "*":
    allowed_origins = ["*"]
    allow_credentials = False
else:
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
# Initialize components
try:
    generator = MVPGenerator()
except Exception as e:
    print(f"Failed to initialize MVPGenerator: {e}")
    # Create a dummy generator that fails gracefully
    class DummyGenerator:
        async def create_plan(self, *args, **kwargs):
            raise Exception(f"Generator failed to initialize: {e}")
        async def generate(self, *args, **kwargs):
            yield {"type": "error", "message": f"Generator failed to initialize: {e}"}
    generator = DummyGenerator()
preview_server = PreviewServer()

# Output directory for generated files
OUTPUT_DIR = Path(__file__).parent / "generated_output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Mount static files for cloud preview
app.mount("/preview", StaticFiles(directory=OUTPUT_DIR, html=True), name="preview")


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {"status": "ok", "message": "Split AI Backend is running"}


@app.post("/api/plan")
async def generate_plan(request: Request):
    """
    Generate a project plan from transcript
    Returns JSON plan (Tasks + Files)
    """
    try:
        log_path = Path(__file__).parent / "access_log.txt"
        with open(log_path, "a") as f:
            f.write("Hit generate_plan\n")
    except:
        pass
        
    body = await request.json()
    transcript = body.get("transcript", "")
    image_base64 = body.get("image", None)
    
    if not transcript and not image_base64:
        return JSONResponse(status_code=400, content={"error": "No transcript or image provided"})
        
    try:
        plan = await generator.create_plan(transcript, image_base64=image_base64)
        
        # PERSIST PLAN TO DB
        project_id = body.get("project_id", None)
        if project_id:
            try:
                from db import crud, database
                next(database.get_db()) # just a check, normally used in deps
                # We need a session, let's get it from the fastai request context or open a new one
                from db.database import SessionLocal
                with SessionLocal() as db:
                    crud.update_project_metadata(db, project_id, plan_json=json.dumps(plan))
            except Exception as e:
                print(f"Failed to persist plan to DB: {e}")
        
        return plan
    except Exception as e:
        # Log to file for debugging
        try:
            error_log_path = Path(__file__).parent / "error_log.txt"
            with open(error_log_path, "a") as f:
                import traceback
                f.write(f"Error in generate_plan: {e}\n{traceback.format_exc()}\n")
        except:
            pass
        return JSONResponse(status_code=500, content={"error": str(e)})



@app.post("/api/generate")
async def generate_website(request: Request):
    """
    Generate website from voice transcript OR plan
    Uses Server-Sent Events (SSE) for streaming code generation
    """
    body = await request.json()
    transcript = body.get("transcript", "")
    plan = body.get("plan", None)
    project_id = body.get("project_id", None)
    image_base64 = body.get("image", None)
    
    if not transcript and not plan and not image_base64:
        return JSONResponse(
            status_code=400,
            content={"error": "No transcript, plan, or image provided"}
        )
    
    async def event_stream():
        """Generator function for SSE stream"""
        try:
            # Accumulate file contents per-file from the stream for accurate DB save
            generated_files: dict = {}
            current_file = None

            def save_to_db(fname, content):
                """Open a fresh session for each save — safe inside async generators."""
                if not project_id:
                    return
                try:
                    from db import crud
                    from db.database import SessionLocal
                    with SessionLocal() as fresh_db:
                        crud.save_file(fresh_db, project_id, fname, content)
                        print(f"[DB] Saved {fname} to project {project_id}")
                except Exception as e:
                    print(f"[DB] Save failed for {fname}: {e}")

            if plan:
                async for event in generator.execute_plan(plan, OUTPUT_DIR, image_base64=image_base64):
                    etype = event["type"]
                    if etype == "file_start":
                        current_file = event["filename"]
                        generated_files[current_file] = ""
                    elif etype == "code_chunk" and current_file:
                        generated_files[current_file] = generated_files.get(current_file, "") + event["content"]
                    elif etype == "file_complete" and current_file:
                        save_to_db(current_file, generated_files.get(current_file, ""))
                    yield f"data: {json.dumps(event)}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing your request...'})}\n\n"
                async for event in generator.generate(transcript, OUTPUT_DIR, image_base64=image_base64):
                    etype = event["type"]
                    if etype == "file_start":
                        current_file = event["filename"]
                        generated_files[current_file] = ""
                    elif etype == "code_chunk" and current_file:
                        generated_files[current_file] = generated_files.get(current_file, "") + event["content"]
                    elif etype == "file_complete" and current_file:
                        save_to_db(current_file, generated_files.get(current_file, ""))
                    yield f"data: {json.dumps(event)}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )



@app.post("/api/edit")
async def edit_website(request: Request):
    """
    Edit existing website based on instruction
    Uses Server-Sent Events (SSE) for streaming updates
    """
    body = await request.json()
    instruction = body.get("instruction", "")
    files = body.get("files", {})
    project_id = body.get("project_id", None)
    image_base64 = body.get("image", None)

    if not instruction and not image_base64:
        return JSONResponse(
            status_code=400,
            content={"error": "No instruction or image provided"}
        )

    async def event_stream():
        """Generator function for SSE stream"""
        try:
            current_file = None
            generated_files: dict = {}

            def save_to_db(fname, content):
                if not project_id:
                    return
                try:
                    from db import crud
                    from db.database import SessionLocal
                    with SessionLocal() as fresh_db:
                        crud.save_file(fresh_db, project_id, fname, content)
                        print(f"[DB] Edit saved {fname} to project {project_id}")
                except Exception as e:
                    print(f"[DB] Edit save failed for {fname}: {e}")

            async for event in generator.edit_project(files, instruction, OUTPUT_DIR, image_base64=image_base64):
                etype = event["type"]
                if etype == "file_start":
                    current_file = event["filename"]
                    generated_files[current_file] = ""
                elif etype == "code_chunk" and current_file:
                    generated_files[current_file] = generated_files.get(current_file, "") + event["content"]
                elif etype == "file_complete" and current_file:
                    save_to_db(current_file, generated_files.get(current_file, ""))
                yield f"data: {json.dumps(event)}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )


@app.post("/api/preview/launch")
async def launch_preview(request: Request):
    """
    Returns the cloud-friendly preview URL
    """
    try:
        # Get the base URL of the current request (works on localhost and Render)
        base_url = str(request.base_url).rstrip("/")
        # Point to the static route we just mounted
        url = f"{base_url}/preview/index.html"
        return {"url": url, "status": "launched"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/preview/stop")
async def stop_preview():
    """Stop the preview server"""
    try:
        await preview_server.stop()
        return {"status": "stopped"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
