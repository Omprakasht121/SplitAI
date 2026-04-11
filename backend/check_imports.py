import sys
from pathlib import Path

# Simulate running from root
sys.path.insert(0, str(Path(__file__).parent.parent))

print(f"Path: {sys.path[0]}")

try:
    print("Attempting to import backend.main...")
    import backend.main
    print("✅ Success: backend.main imported")
except Exception as e:
    print(f"❌ Failed to import backend.main: {e}")

try:
    print("Attempting to import generators.mvp_generator (local simulate)...")
    # This simulates if we are inside backend/
    sys.path.insert(0, str(Path(__file__).parent))
    from generators.mvp_generator import MVPGenerator
    print("✅ Success: MVPGenerator imported locally")
except Exception as e:
    print(f"❌ Failed to import MVPGenerator: {e}")
