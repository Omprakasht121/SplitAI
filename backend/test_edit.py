import requests
import json
import sys

def test_edit():
    url = "http://127.0.0.1:8000/api/edit"
    
    # Mock existing files
    files = {
        "index.html": "<html><body><h1>Hello World</h1></body></html>",
        "style.css": "body { color: black; }"
    }
    
    instruction = "Change the background to blue and add a footer"
    
    print(f"Testing Edit Endpoint: {url}")
    print(f"Instruction: {instruction}")
    
    try:
        response = requests.post(
            url, 
            json={"files": files, "instruction": instruction},
            stream=True
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error: {response.text}")
            return
            
        print("\nStreaming Response:")
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith("data: "):
                    data_str = decoded[6:]
                    if data_str == "[DONE]":
                        print("\n[DONE] Stream Complete")
                        break
                    try:
                        data = json.loads(data_str)
                        if data['type'] == 'status':
                            print(f"Status: {data['message']}")
                        elif data['type'] == 'file_start':
                            print(f"\n[Start File: {data['filename']}]")
                        elif data['type'] == 'code_chunk':
                            sys.stdout.write(data['content'])
                            sys.stdout.flush()
                        elif data['type'] == 'error':
                             print(f"Error: {data['message']}")
                    except json.JSONDecodeError:
                        print(f"Raw: {decoded}")
                        
    except Exception as e:
        print(f"Request Failed: {e}")

if __name__ == "__main__":
    test_edit()
