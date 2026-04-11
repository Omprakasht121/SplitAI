import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from ai.prompts import Prompts
    print("Prompts imported successfully!")
except Exception as e:
    print(f"FAILED: {e}")
