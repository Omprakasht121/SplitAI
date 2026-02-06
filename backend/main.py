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

# Initialize FastAPI app
app = FastAPI(
    title="Split AI",
    description="Voice-driven AI website builder backend",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
generator = MVPGenerator()
preview_server = PreviewServer()

# Output directory for generated files
OUTPUT_DIR = Path(__file__).parent / "generated_output"
OUTPUT_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {"status": "ok", "message": "Split AI Backend is running"}


@app.post("/api/generate")
async def generate_website(request: Request):
    """
    Generate website from voice transcript
    Uses Server-Sent Events (SSE) for streaming code generation
    """
    body = await request.json()
    transcript = body.get("transcript", "")
    
    if not transcript:
        return JSONResponse(
            status_code=400,
            content={"error": "No transcript provided"}
        )
    
    async def event_stream():
        """Generator function for SSE stream"""
        try:
            # Phase 1: Parse intent and plan
            yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing your request...'})}\n\n"
            await asyncio.sleep(0.5)
            
            # Phase 2: Generate files
            async for event in generator.generate(transcript, OUTPUT_DIR):
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.02)  # Small delay for visual effect
            
            # Signal completion
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
async def launch_preview():
    """
    Launch preview server for generated website
    Returns the preview URL
    """
    try:
        url = await preview_server.start(OUTPUT_DIR)
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
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
