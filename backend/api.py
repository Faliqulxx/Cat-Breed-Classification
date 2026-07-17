import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"
import io
import numpy as np
import urllib.request
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow import keras

app = FastAPI(title="Cat Breed Classification API")

# Setup CORS to allow React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all origins.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# LOAD LABELS
# =============================
def load_labels():
    # Because api.py is in backend/, we assume labels.txt is in the same directory
    with open("labels.txt") as f:
        return [line.strip() for line in f.readlines()]

try:
    CLASS_NAMES = load_labels()
except FileNotFoundError:
    # If labels.txt is in the parent directory
    with open("../labels.txt") as f:
        CLASS_NAMES = [line.strip() for line in f.readlines()]

# =============================
# LOAD MODELS
# =============================
# We load them globally to avoid reloading on each request
# Since we are in the backend directory, paths should be relative to it, or parent if models are in root.
# In the original app.py, models were loaded from "models/...".
# Let's check where the models folder is. The list_dir showed models in e:\UAP_Machine_Learning\models
MODELS_DIR = "models"

def get_model_path(filename):
    filepath = os.path.join(MODELS_DIR, filename)
    # If the file is an LFS pointer (< 1KB) or missing, download it directly from GitHub raw LFS media
    if not os.path.exists(filepath) or os.path.getsize(filepath) < 1024:
        print(f"File {filepath} is an LFS pointer or missing. Downloading from GitHub...")
        url = f"https://media.githubusercontent.com/media/Faliqulxx/Cat-Breed-Classification/main/backend/models/{filename}"
        os.makedirs(MODELS_DIR, exist_ok=True)
        urllib.request.urlretrieve(url, filepath)
        print(f"Downloaded {filename} successfully.")
    return filepath

print("Loading models...")
try:
    MODELS = {
        "CNN Scratch": keras.models.load_model(get_model_path("cnn_scratch_cat_breed_final.keras")),
        "MobileNetV2": keras.models.load_model(get_model_path("mobilenetv2_cat_breed_final.keras")),
        "ResNet50": keras.models.load_model(get_model_path("resnet50_cat_breed_final.keras")),
    }
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    MODELS = {}

# =============================
# IMAGE PREPROCESS
# =============================
def preprocess_image(image_bytes, img_size=224):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((img_size, img_size))
    image = np.array(image) / 255.0
    return np.expand_dims(image, axis=0)

# =============================
# API ENDPOINTS
# =============================
@app.get("/")
def read_root():
    return {"message": "Cat Breed Classification API is running"}

@app.get("/models")
def get_models():
    return {"models": list(MODELS.keys())}

@app.get("/classes")
def get_classes():
    return {"classes": CLASS_NAMES}

@app.post("/predict")
async def predict(file: UploadFile = File(...), model_name: str = Form("MobileNetV2")):
    if model_name not in MODELS:
        return {"error": "Invalid model name"}
    
    model = MODELS[model_name]
    image_bytes = await file.read()
    
    input_tensor = preprocess_image(image_bytes)
    preds = model.predict(input_tensor)[0]
    
    pred_index = np.argmax(preds)
    confidence = float(preds[pred_index])
    
    # Calculate probabilities for all classes
    prob_dict = {
        CLASS_NAMES[i]: float(preds[i])
        for i in range(len(CLASS_NAMES))
    }
    
    # Sort probability dictionary by value (descending)
    sorted_probs = {k: v for k, v in sorted(prob_dict.items(), key=lambda item: item[1], reverse=True)}
    
    return {
        "model": model_name,
        "prediction": CLASS_NAMES[pred_index],
        "confidence": confidence,
        "probabilities": sorted_probs
    }
