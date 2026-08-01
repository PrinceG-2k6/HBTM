import google.genai as genai
import os
from dotenv import load_dotenv

load_dotenv("aiml_backend/.env")

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
try:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents="Hello, how are you?"
    )
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
