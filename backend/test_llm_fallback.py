
import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock

# Add backend
sys.path.append(os.getcwd())

from ai.llm_client import LLMClient
import google.generativeai as genai

async def test_fallback():
    print("Testing LLM Fallback...")
    
    # Mock genai
    original_generative_model = genai.GenerativeModel
    
    mock_model_bad = AsyncMock()
    mock_model_bad.generate_content_async.side_effect = Exception("429 Quota Exceeded")
    
    mock_model_good = AsyncMock()
    mock_response = MagicMock()
    mock_response.text = "Success!"
    mock_model_good.generate_content_async.return_value = mock_response
    
    def side_effect(model_name):
        if model_name == "gemini-2.0-flash":
            print(f"Mocking failure for {model_name}")
            return mock_model_bad
        else:
            print(f"Mocking success for {model_name}")
            return mock_model_good

    genai.GenerativeModel = MagicMock(side_effect=side_effect)
    
    try:
        client = LLMClient(api_key="test")
        # Overwrite available models to known test order
        client.available_models = ["gemini-2.0-flash", "gemini-fallback"]
        client.current_model_name = "gemini-2.0-flash"
        
        response = await client.generate_response("test")
        
        if response == "Success!":
            print("SUCCESS: Fallback worked!")
            if client.current_model_name == "gemini-fallback":
                print("SUCCESS: Model switched correctly.")
            else:
                print(f"FAILURE: Model did not switch (Current: {client.current_model_name})")
        else:
            print(f"FAILURE: Unexpected response: {response}")
            
    except Exception as e:
        print(f"FAILURE: Exception caught: {e}")
    finally:
        genai.GenerativeModel = original_generative_model

if __name__ == "__main__":
    asyncio.run(test_fallback())
