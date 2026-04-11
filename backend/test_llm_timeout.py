
import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock
import time

# Add backend
sys.path.append(os.getcwd())

from ai.llm_client import LLMClient
import google.generativeai as genai

async def test_timeout():
    print("Testing LLM Timeout...")
    
    # Mock genai
    original_generative_model = genai.GenerativeModel
    
    async def slow_response(*args, **kwargs):
        print("Mock: Starting slow response (sleeping 35s)...")
        # Since wait_for is 30s, this should raise TimeoutError
        await asyncio.sleep(35)
        return MagicMock(text="Too late!")

    mock_model = AsyncMock()
    mock_model.generate_content_async = slow_response
    
    genai.GenerativeModel = MagicMock(return_value=mock_model)
    
    try:
        client = LLMClient(api_key="test")
        # Restrict to one model to test timeout
        client.available_models = ["gemini-slow"]
        client.current_model_name = "gemini-slow"
        
        start = time.time()
        try:
            await client.generate_response("test")
            print("FAILURE: Operation did not time out!")
        except Exception as e:
            duration = time.time() - start
            print(f"caught exception: {e}")
            if "Request timed out" in str(e) or "All models failed" in str(e):
                 print(f"SUCCESS: Timed out in {duration:.2f}s")
            else:
                 print(f"FAILURE: Wrong exception: {e}")

    except Exception as e:
        print(f"FAILURE: Setup/Outer exception: {e}")
    finally:
        genai.GenerativeModel = original_generative_model

if __name__ == "__main__":
    asyncio.run(test_timeout())
          




           
             
               
            