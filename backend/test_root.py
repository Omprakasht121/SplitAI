import requests

def test_root():
    url = "http://127.0.0.1:8001/"
    print(f"Testing {url}...")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    
    test_root()
