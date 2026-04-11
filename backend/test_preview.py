import asyncio
from pathlib import Path
from preview.server import PreviewServer
import requests
import time

async def test_preview():
    print("Testing Preview Server...")
    server = PreviewServer()
    output_dir = Path("backend/generated_output").absolute()
    
    print(f"Starting server in {output_dir}")
    try:
        url = await server.start(output_dir)
        print(f"Server started at {url}")
        
        # Wait a bit
        time.sleep(1)
        
        # Test connection
        print("Sending request...")
        response = requests.get(url)
        print(f"Response Code: {response.status_code}")
        print(f"Response Content: {response.text}")
        
        if "It Works!" in response.text:
            print("✅ Preview Server Verified")
        else:
            print("❌ Content Mismatch")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        print("Stopping server...")
        await server.stop()

if __name__ == "__main__":
    asyncio.run(test_preview())
