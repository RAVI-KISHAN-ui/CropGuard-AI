from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import json
import io
from openai import OpenAI
from dotenv import load_dotenv
import os
from pydantic import BaseModel

app = FastAPI(title="Plant Disease Detection API")
load_dotenv()

# OpenRouter client setup
or_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and labels once at startup
model = load_model("model/plant_disease_model.keras")
with open("model/class_labels.json", "r") as f:
    labels = json.load(f)

@app.get("/")
def home():
    return {"message": "Plant Disease Detection API is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB").resize((224, 224))
    arr = np.expand_dims(np.array(img) / 255.0, axis=0)

    predictions = model.predict(arr)
    idx = int(np.argmax(predictions))
    confidence = float(np.max(predictions))

    return {
        "disease": labels[str(idx)],
        "confidence": round(confidence * 100, 2)
    }

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        completion = or_client.chat.completions.create(
            model="openrouter/free",
            messages=[
                {"role": "system", "content": "You are a helpful plant disease expert assistant for a plant disease detection app covering Pepper, Potato, and Tomato diseases. Answer concisely in 2-4 sentences. Redirect unrelated questions back to plant topics."},
                {"role": "user", "content": req.message}
            ]
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        return {"reply": f"Sorry, I couldn't process that right now. ({str(e)})"}