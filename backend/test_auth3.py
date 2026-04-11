from routers.auth import register, UserCreate
from db import database

db = next(database.get_db())
user = UserCreate(name="test3", email="test3@test.com", password="pass")
try:
    print(register(user, db))
except Exception as e:
    import traceback
    traceback.print_exc()
