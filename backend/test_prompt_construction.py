
import sys
import os
import json

# Add backend to path
sys.path.append(os.getcwd())

from ai.prompts import Prompts

def test_prompt():
    plan = {
        "original_request": "Test Website",
        "tasks": ["Task 1", "Task 2"],
        "files": [
            {"name": "index.html", "description": "Main page"},
            {"name": "style.css", "description": "Styles"}
        ]
    }
    
    prompt = Prompts.generate_single_file_prompt("index.html", "Main page", plan)
    
    print("Generated Prompt:")
    print(prompt)
    
    # Assertions
    if "Files in Project:" in prompt and "style.css" in prompt:
        print("\nSUCCESS: 'Files in Project' and 'style.css' found in prompt.")
    else:
        print("\nFAILURE: 'Files in Project' or 'style.css' NOT found in prompt.")

    if "<link rel=\"stylesheet\"" in prompt:
         print("SUCCESS: Linking instruction found.")
    else:
         print("FAILURE: Linking instruction NOT found.")

if __name__ == "__main__":
    test_prompt()
