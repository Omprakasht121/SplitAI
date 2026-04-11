import asyncio
import sys
import os

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from generators.mvp_generator import MVPGenerator
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

# Hardcoded key from .env check
API_KEY = "AIzaSyAZey3dvYfBDOy0Pj2cDx--ipIAIZWVreE"
os.environ["GEMINI_API_KEY"] = API_KEY

async def test():
    print("Testing Backend with Hardcoded Key...")
    
    try:
        generator = MVPGenerator()
        
        # Check if LLMClient initialized
        if generator.use_llm:
            print("✅ LLMClient initialized successfully")
        else:
            print("⚠️ LLMClient failed to init, using templates")
            
        print("Generating...")
        # Mock output dir
        from pathlib import Path
        output_dir = Path("test_output")
        output_dir.mkdir(exist_ok=True)
        
        async for chunk in generator.generate("a landing page for a coffee shop", output_dir):
            print(f"Chunk type: {chunk.get('type')}")
            if chunk.get('type') == 'code_chunk':
                print(f"  Content length: {len(chunk['content'])}")
                
        print("Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
