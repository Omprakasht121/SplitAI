
import sys
from pathlib import Path

# Simulate the sys.path modification from mvp_generator.py
current_dir = Path(__file__).parent
backend_dir = current_dir.parent
sys.path.append(str(backend_dir))

print(f"sys.path: {sys.path}")

try:
    print("Attempting: from ai.prompts import Prompts")
    from ai.prompts import Prompts
    print("Success: from ai.prompts import Prompts")
except ImportError as e:
    print(f"Failed: from ai.prompts import Prompts. Error: {e}")

try:
    print("Attempting: from backend.ai.prompts import Prompts")
    from backend.ai.prompts import Prompts
    print("Success: from backend.ai.prompts import Prompts")
except ImportError as e:
    print(f"Failed: from backend.ai.prompts import Prompts. Error: {e}")

try:
    print("Attempting: from ..ai.prompts import Prompts")
    from ..ai.prompts import Prompts
    print("Success: from ..ai.prompts import Prompts")
except ImportError as e:
    print(f"Failed: from ..ai.prompts import Prompts. Error: {e}")
except ValueError as e:
    print(f"Failed: from ..ai.prompts import Prompts. Error: {e}")
