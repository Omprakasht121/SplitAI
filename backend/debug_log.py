
import asyncio
import sys
import os
from pathlib import Path
import json

# Add backend to path
sys.path.append(os.getcwd())


class MockLLM:
    async def generate_response(self, prompt, **kwargs):
        return json.dumps({"code": "/* content */"})

async def test():
    # Fix path to include parent of backend so 'backend.ai' imports work
    current = os.getcwd()
    if str(Path(current).parent) not in sys.path:
        sys.path.append(str(Path(current).parent))
    
    # Move import here to catch errors
    try:
        from generators.mvp_generator import MVPGenerator
    except ImportError as e:
        print(f"ImportError during verification: {e}")
        return

    print("Testing logging...")
    gen = MVPGenerator()

    gen.llm_client = MockLLM()
    gen.use_llm = True
    
    plan = {
        "files": [{"name": "test_log.txt", "description": "test"}]
    }
    
    # Run the generator
    async for event in gen.execute_plan(plan, Path("test_output_log")):
        pass
        
    print("Finished generation.")

if __name__ == "__main__":
    try:
        Path("test_output_log").mkdir(exist_ok=True)
        asyncio.run(test())
    except Exception as e:
        import traceback
        with open("debug_error.log", "w") as f:
            f.write(f"Error: {e}\n")
            traceback.print_exc(file=f)
        print(f"Error: {e}")
        traceback.print_exc()
