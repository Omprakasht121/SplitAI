import requests
import json

def test_plan_endpoint():
    url = "http://127.0.0.1:8001/api/plan"
    payload = {"transcript": "Create a test website"}
    
    print(f"Testing {url}...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json())
            print("✅ API is working!")
        else:
            print(f"❌ API Error: {response.text}")
            with open("backend/last_error.txt", "w") as f:
                f.write(response.text)
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_plan_endpoint()
