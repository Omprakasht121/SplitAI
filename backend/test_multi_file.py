import asyncio
import json
import sys
import os
from pathlib import Path

# Mock classes to avoid full backend initialization
class MockLLMClient:
    async def generate_response(self, prompt: str, **kwargs) -> str:
        # Return dummy code based on prompt content
        if "index.html" in prompt:
            return json.dumps({"code": "<html><h1>Index</h1></html>"})
        elif "about.html" in prompt:
            return json.dumps({"code": "<html><h1>About</h1></html>"})
        elif "script.js" in prompt:
            return "console.log('Hello');"
        return "/* Unknown file */"

async def test_multi_file_generation():
    # Setup paths
    base_dir = Path(__file__).parent
    output_dir = base_dir / "test_output"
    output_dir.mkdir(exist_ok=True)
    
    # Import MVPGenerator (path hack)
    sys.path.insert(0, str(base_dir))
    try:
        from generators.mvp_generator import MVPGenerator
    except ImportError:
        # Try adjusting path if needed, but assuming relative to backend root
        sys.path.insert(0, str(base_dir.parent))
        from backend.generators.mvp_generator import MVPGenerator

    # Initialize Generator with Mock LLM
    generator = MVPGenerator()
    generator.llm_client = MockLLMClient()
    generator.use_llm = True
    
    # Define Multi-file Plan
    plan = {
        "original_request": "Test Multi-Page",
        "type": "marketing",
        "files": [
            {"name": "index.html", "description": "Home page"},
            {"name": "about.html", "description": "About page"},
            {"name": "script.js", "description": "Main script"}
        ]
    }
    
    print("Testing Multi-File Generation...", flush=True)
    
    # Execute Plan
    async for event in generator.execute_plan(plan, output_dir):
        if event['type'] == 'status':
            print(f"Status: {event['message']}", flush=True)
        elif event['type'] == 'file_complete':
            print(f"File Complete: {event['filename']}", flush=True)
        elif event['type'] == 'error':
            print(f"Error: {event['message']}", flush=True)

    # Verify Files
    files_created = sorted([f.name for f in output_dir.glob("*") if f.is_file()])
    print(f"\nFiles Created: {files_created}", flush=True)
    
    expected = ["about.html", "index.html", "script.js"]
    if all(f in files_created for f in expected):
        print("SUCCESS: All files generated.", flush=True)
    else:
        print(f"FAILURE: Expected {expected}, got {files_created}", flush=True)

# Redirect stdout to a file
import sys

class Tee(object):
    def __init__(self, name, mode):
        self.file = open(name, mode)
        self.stdout = sys.stdout
        sys.stdout = self
    def __del__(self):
        sys.stdout = self.stdout
        self.file.close()
    def write(self, data):
        self.file.write(data)
        self.stdout.write(data)
        self.file.flush()
    def flush(self):
        self.file.flush()

if __name__ == "__main__":
    # Log to file
    log_file = Path(__file__).parent / "test_output.txt"
    sys.stdout = Tee(str(log_file), "w")

    print("Starting Main...", flush=True)
    asyncio.run(test_multi_file_generation())
    print("Main Finished.", flush=True)
