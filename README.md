#  CropGuard AI

An end-to-end AI-powered plant disease detection application with a custom mobile-style interface, live camera scanning, and an AI chatbot assistant — built using Deep Learning (Transfer Learning with MobileNetV2).

##  Live Demo
- **App (Frontend)**: https://crop-guard-ai-sigma.vercel.app
- **Backend API Docs (Swagger)**: https://cropguard-backend-g1nm.onrender.com/docs

> Note: The backend is hosted on Render's free tier and may take 30–60 seconds to wake up if idle.

## Features
- 📷 **Live Camera Scanner** — capture leaf photos directly from your device camera
- 📁 **Gallery Upload** — or upload an existing photo
- 🧠 **AI Disease Detection** — MobileNetV2 model predicts disease + confidence score
- 💬 **AI Plant Assistant** — chatbot (powered by OpenRouter) answers questions about plant diseases, symptoms, and treatment
- 🔍 **Explore & Search** — browse supported crops and diseases with detail popups
- 🎨 **Custom mobile-app style UI** — dark theme, bottom navigation, floating scan button

## Problem Statement
Manual disease identification in crops is slow, subjective, and dependent on expert availability, leading to delayed intervention and crop losses. CropGuard AI provides an automated, image-based diagnosis system that any farmer can use with just a photo — plus an AI assistant for follow-up questions.

## Dataset
- **PlantVillage Dataset** (Kaggle): https://www.kaggle.com/datasets/emmarex/plantdisease
- 15 classes across Pepper, Potato, and Tomato (healthy + disease categories)
- ~20,600 images (16,516 training / 4,122 validation)
- Reference paper: [PlantVillage Dataset — Mohanty et al.](https://arxiv.org/abs/1511.08060)

## Tech Stack
- **Model**: TensorFlow/Keras, MobileNetV2 (Transfer Learning)
- **Backend**: FastAPI, Python 3.11
- **Frontend**: HTML, CSS, JavaScript (vanilla — no framework)
- **Chatbot**: OpenRouter API (free-tier LLM routing)
- **Training Platform**: Kaggle Notebooks (GPU T4)
- **Deployment**: Render (Backend) · Vercel (Frontend)

## Model Performance
- Validation Accuracy: **91.95%**
- Validation Loss: **0.2415**

## Project Structure
plant-didec.ai/
├── model/
│ ├── plant_disease_model.keras
│ └── class_labels.json
├── frontend/
│ ├── index.html
│ ├── style.css
│ ├── script.js
│ └── assets/
│ └── patta.jpeg
├── main.py # FastAPI backend (predict + chat endpoints)
├── requirements-backend.txt
├── runtime.txt
├── .gitignore
└── README.md

## Setup & Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/RAVI-KISHAN-ui/CropGuard-AI.git
cd CropGuard-AI
```

### 2. Backend setup
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements-backend.txt
```

Create a `.env` file in the root folder:

Run the backend:
```bash
uvicorn main:app --reload
```

### 3. Frontend setup
Open `frontend/script.js` and point `API_URL` / `CHAT_API_URL` to `http://127.0.0.1:8000` for local testing. Then simply open `frontend/index.html` in a browser (or use a local server like VS Code Live Server).

## API Documentation
Swagger UI available at `/docs` when the backend is running.

**`POST /predict`**
- Input: leaf image file (`multipart/form-data`)
- Output:
```json
{
  "disease": "Tomato_Late_blight",
  "confidence": 84.76
}
```

**`POST /chat`**
- Input: `{ "message": "What is Late Blight?" }`
- Output: `{ "reply": "..." }`
- Powered by OpenRouter's free-tier auto-router (`openrouter/free`), which automatically selects an available free LLM.

## Model Details
- Base: MobileNetV2 (ImageNet pretrained, frozen)
- Head: GlobalAveragePooling2D → Dense(128, ReLU) → Dropout(0.3) → Dense(15, Softmax)
- Optimizer: Adam · Loss: Categorical Cross-Entropy
- Trained for 12 epochs with EarlyStopping (patience=3)

## Limitations & Future Work
- Currently covers only 3 crops (Pepper, Potato, Tomato) and 15 classes, out of the full PlantVillage dataset's 38 classes.
- No out-of-distribution detection — non-leaf images are still classified into one of the 15 trained classes rather than rejected.
- Performs best on clean, close-up leaf images similar to the training data; accuracy may drop on images with varied lighting/backgrounds.
- Future improvements: fine-tuning base layers, confidence-threshold rejection for non-leaf images, and edge deployment (TensorFlow Lite).

## Security Note
The OpenRouter API key is stored as an environment variable on the backend (never committed to the repo) and is never exposed to the frontend/browser.

## Academic Integrity
This project uses the publicly available PlantVillage dataset (Kaggle) and is built independently for academic/internship purposes. All external resources are cited above.

## Author
Ravi Kishan
