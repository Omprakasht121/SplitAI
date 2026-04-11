
import os
import google.generativeai as genai
from typing import Optional, AsyncGenerator

class LLMClient:
    """Client for interacting with Google Gemini API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        genai.configure(api_key=self.api_key)
        
        # Priority list of models to try - Expanded to handle heavy rate limiting
        self.available_models = [
            # Lites and Previews (Likely have fresh quota)
            'gemini-2.5-flash-lite',
            'gemini-flash-lite-latest',
            'gemini-2.0-flash-lite-001',
            'gemini-3-flash-preview',
            'gemini-2.5-flash-preview-09-2025',
            
            # Standard Performance Models
            'gemini-2.5-flash',
            'gemini-2.0-flash', 
            'gemini-2.5-pro',
            'gemini-2.0-flash-lite',
            'gemini-exp-1206',
            'gemini-2.0-flash-001',
            
            # Fallbacks
            'gemini-flash-latest',
            'gemini-pro-latest'
        ]
        self.current_model_name = self.available_models[0]
        self.model = genai.GenerativeModel(self.current_model_name)
        print(f"LLMClient initialized with model: {self.current_model_name}")

    async def _try_generate(self, model_name: str, contents: list, generation_config) -> str:
        import asyncio
        model = genai.GenerativeModel(model_name)
        # Set a timeout for the API call to prevent hanging
        # Google's SDK might retry internally, we want to cap that execution time
        try:
            response = await asyncio.wait_for(
                model.generate_content_async(contents, generation_config=generation_config),
                timeout=30.0 # 30 seconds max per model try
            )
            return response.text
        except asyncio.TimeoutError:
            raise Exception("Request timed out (30s limit)")

    async def generate_response(self, prompt: str, temperature: float = 1.0, image_base64: Optional[str] = None) -> str:
        """Generate a complete response from the model with fallback"""
        import logging
        generation_config = genai.types.GenerationConfig(temperature=temperature)
        
        contents = [prompt]
        if image_base64:
            # Handle data URL "data:image/jpeg;base64,..."
            if "," in image_base64:
                mime_part, b64_data = image_base64.split(",", 1)
                mime_type = mime_part.split(":")[1].split(";")[0]
            else:
                mime_type = "image/jpeg"
                b64_data = image_base64
            contents.append({"mime_type": mime_type, "data": b64_data})
        
        # Try current model first
        try:
             # If we haven't failed recently, use the current default
             return await self._try_generate(self.current_model_name, contents, generation_config)
        except Exception as e:
            logging.warning(f"Error with primary model {self.current_model_name}: {e}")
            
            # If that failed, iterate through ALL models to find one that works
            errors = []
            for model_name in self.available_models:
                if model_name == self.current_model_name:
                    continue # Already tried
                    
                logging.info(f"Falling back to model: {model_name}...")
                try:
                    result = await self._try_generate(model_name, contents, generation_config)
                    # Support: if this worked, switch to it for future?
                    self.current_model_name = model_name
                    self.model = genai.GenerativeModel(model_name)
                    logging.info(f"Successfully switched to {model_name}")
                    return result
                except Exception as fallback_error:
                    logging.warning(f"Failed with {model_name}: {fallback_error}")
                    errors.append(f"{model_name}: {fallback_error}")
            
            # If all failed
            error_msg = f"All models failed. Errors: {'; '.join(errors)}"
            logging.error(error_msg)
            raise Exception(error_msg)

    async def stream_response(self, prompt: str, temperature: float = 1.0, image_base64: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Stream response from the model"""
        # Streaming fallback is harder to implement cleanly in one go without potential partial output.
        # For now, we will try to use the current working model.
        try:
            generation_config = genai.types.GenerationConfig(temperature=temperature)
            
            contents = [prompt]
            if image_base64:
                if "," in image_base64:
                    mime_part, b64_data = image_base64.split(",", 1)
                    mime_type = mime_part.split(":")[1].split(";")[0]
                else:
                    mime_type = "image/jpeg"
                    b64_data = image_base64
                contents.append({"mime_type": mime_type, "data": b64_data})

            response = await self.model.generate_content_async(contents, stream=True, generation_config=generation_config)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Error streaming response: {e}")
             # Minimal fallback for streaming: try one more time with a robust model if strictly needed, 
             # but for now raising is safer than mixing logical complexity here.
            raise
