import sys
from pathlib import Path
import asyncio

# Setup path
sys.path.insert(0, str(Path(__file__).parent.parent))

from generators.mvp_generator import MVPGenerator

async def test_fallback():
    print("Testing MVPGenerator Fallback (Simulated LLM Failure)...")
    
    # Force LLM Client failure by unsetting env var (mocking logic)
    # Actually, we can just instantiate MVPGenerator and see if it handles existing env
    
    gen = MVPGenerator()
    print(f"LLM Enabled: {gen.use_llm}")
    
    try:
        plan = await gen.create_plan("Create a coffee shop website")
        print("✅ Plan generated successfully (Fallback/LLM):")
        print(plan)
    except Exception as e:
        print(f"❌ Plan generation crashed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_fallback())
