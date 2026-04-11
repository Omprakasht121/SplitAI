import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    print("Attempting import...")
    from generators.mvp_generator import MVPGenerator
    print("Import Successful!")
except Exception as e:
    print(f"Import Failed: {e}")
except ImportError as e:
    print(f"Import Error: {e}")
