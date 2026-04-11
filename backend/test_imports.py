import sys
import os
print(f"CWD: {os.getcwd()}")
print(f"Path: {sys.path}")
try:
    import ai
    print(f"ai package: {ai}")
    from ai.llm_client import LLMClient
    print("Successfully imported LLMClient")
except Exception as e:
    print(f"Import Error: {e}")
