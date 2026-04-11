import requests
response = requests.post("http://127.0.0.1:8000/api/auth/register", json={"name": "test", "email": "test@test.com", "password": "pass"})
print(response.status_code)
print(response.text)
