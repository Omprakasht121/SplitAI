from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
try:
    response = client.post("/api/auth/register", json={"name": "test2", "email": "test2@test.com", "password": "pass"})
    print("Status:", response.status_code)
    try:
        print("Body:", response.json())
    except:
        print("Body:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
