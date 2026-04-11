import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment.")
else:
    genai.configure(api_key=api_key)
    print("Checking available models...")
    output_path = os.path.join(os.path.dirname(__file__), "available_models.txt")
    with open(output_path, "w") as f:
        try:
            found = False
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    msg = f"- {m.name}"
                    print(msg, flush=True)
                    f.write(msg + "\n")
                    found = True
            if not found:
                print("No models found with 'generateContent' capability.", flush=True)
                f.write("No models found.\n")
        except Exception as e:
            print(f"Error listing models: {e}", flush=True)
            f.write(f"Error: {e}\n")
