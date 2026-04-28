import os
import json
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from dotenv import load_dotenv

# Load file env
load_dotenv()

firebase_json_env = os.getenv("FIREBASE_CREDENTIALS_JSON")

try:
    if firebase_json_env:
        cert_dict = json.loads(firebase_json_env)
        cred = credentials.Certificate(cert_dict)
    else:
        cred_path = os.getenv("FIREBASE_CREDENTIALS", "../firebase_credentials.json")
        cred = credentials.Certificate(cred_path)
    
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
        print("Firebase Admin Init Success!")
except Exception as e:
    print(f"Firebase Init Error: {e}")

__all__ = ["firebase_auth"]
