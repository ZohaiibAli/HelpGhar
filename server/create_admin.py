from config.db import admin_collection
from helper.password_helper import hash_password

admin_collection.insert_one({
    "name": "Admin",
    "email": "admin@gmail.com",
    "password": hash_password("123456")
})

print("Admin created successfully!")