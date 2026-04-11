
import asyncio
import sys
import os
from pathlib import Path
import json

# Minimal Mock LLM
class MockLLM:
    async def generate_response(self, prompt, **kwargs):
        await asyncio.sleep(0.1) # Simulate network delay
        return json.dumps({"code": f"/* Content for {prompt[:20]}... */"})

async def test():
    # Setup path
    sys.path.append(os.getcwd())
    
    from generators.mvp_generator import MVPGenerator
    
    gen = MVPGenerator()
    gen.llm_client = MockLLM()
    gen.use_llm = True
    
    plan = {
        "files": [
            {"name": "file1.txt", "description": "desc"},
            {"name": "file2.txt", "description": "desc"},
            {"name": "file3.txt", "description": "desc"}
        ]
    }
    
    print("Starting generation...")
    start_time = asyncio.get_event_loop().time()
    
    files_completed = 0
    async for event in gen.execute_plan(plan, Path("test_output_parallel")):
        if event['type'] == 'file_complete':
            files_completed += 1
            print(f"Completed: {event['filename']}")
            
    end_time = asyncio.get_event_loop().time()
    duration = end_time - start_time
    
    print(f"Total time: {duration:.2f}s")
    print(f"Files completed: {files_completed}")
    
    if duration < 1.0 and files_completed == 3:
        print("SUCCESS: Parallel execution confirmed (fast execution)")
    elif files_completed == 3:
        print("WARNING: Slow execution, check parallelization")
    else:
        print("FAILURE: Files missed")

if __name__ == "__main__":
    try:
        Path("test_output_parallel").mkdir(exist_ok=True)
        asyncio.run(test())
    except Exception as e:
        print(f"Error: {e}")
