import asyncio
import os
import sys
from unittest.mock import MagicMock, AsyncMock
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from generators.mvp_generator import MVPGenerator

async def test_image_flow():
    print("Testing backend image flow...")
    
    generator = MVPGenerator()
    
    # Force initialize llm_client if it failed (e.g. due to missing API key)
    if not hasattr(generator, 'llm_client'):
        generator.llm_client = MagicMock()
        generator.use_llm = True
    
    # Mock LLMClient.stream_response
    async def mock_iter():
        yield "<html></html>"
        
    generator.llm_client.stream_response = MagicMock(return_value=mock_iter())
    
    plan = {
        "original_request": "test request",
        "tasks": ["test task"],
        "files": [{"name": "index.html", "description": "test file"}]
    }
    
    output_dir = Path("test_output_dir")
    output_dir.mkdir(exist_ok=True)
    
    image_data = "data:image/jpeg;base64,REDACTED"
    
    print("Executing plan...")
    async for event in generator.execute_plan(plan, output_dir, image_base64=image_data):
        if event["type"] == "status":
            print(f"Status: {event['message']}")

    # Verify that stream_response was called with the image data
    call_args = generator.llm_client.stream_response.call_args
    if call_args:
        args, kwargs = call_args
        if kwargs.get('image_base64') == image_data:
            print("[SUCCESS]: image_base64 was passed to LLMClient.stream_response")
        else:
            print(f"[FAILURE]: image_base64 was NOT passed correctly. Received: {kwargs.get('image_base64')}")
    else:
        print("❌ FAILURE: stream_response was not called")

if __name__ == "__main__":
    asyncio.run(test_image_flow())
