import os
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

def load_model_safely(name, filepath):
    """
    Try to load a model. If it fails (e.g. because it was saved with native
    Keras 3 but we're forcing the legacy tf_keras shim, or vice versa),
    retry once with compile=False and, if that still fails, retry using the
    other Keras implementation before giving up on this specific model.
    """
    # Attempt 1: normal load
    try:
        model = keras.models.load_model(filepath)
        print(f"[OK] {name} loaded successfully.")
        return model
    except Exception as e1:
        print(f"[WARN] {name} failed to load normally: {e1}")

    # Attempt 2: load without compiling (sometimes avoids optimizer/metric
    # deserialization issues that mask the real weight-loading problem)
    try:
        model = keras.models.load_model(filepath, compile=False)
        print(f"[OK] {name} loaded successfully with compile=False.")
        return model
    except Exception as e2:
        print(f"[WARN] {name} failed to load with compile=False: {e2}")

    # Attempt 3: swap Keras implementation (legacy <-> native) and retry.
    # This handles the case where the .keras file was saved in the *other*
    # format than the one currently forced by TF_USE_LEGACY_KERAS.
    try:
        import importlib
        was_legacy = os.environ.get("TF_USE_LEGACY_KERAS") == "1"
        if was_legacy:
            os.environ.pop("TF_USE_LEGACY_KERAS", None)
        else:
            os.environ["TF_USE_LEGACY_KERAS"] = "1"

        import tensorflow as tf
        importlib.reload(tf.keras) if hasattr(tf, "keras") else None
        from tensorflow import keras as keras_alt
        model = keras_alt.models.load_model(filepath, compile=False)

        # restore original env var so other models load with the original setting
        if was_legacy:
            os.environ["TF_USE_LEGACY_KERAS"] = "1"
        else:
            os.environ.pop("TF_USE_LEGACY_KERAS", None)

        print(f"[OK] {name} loaded successfully after swapping Keras implementation.")
        return model
    except Exception as e3:
        print(f"[FAIL] {name} could not be loaded with any strategy: {e3}")
        return None


print("Loading models...")
MODEL_FILES = {
    "CNN Scratch": "cnn_scratch_cat_breed_final.keras",
    "MobileNetV2": "mobilenetv2_cat_breed_final.keras",
    "ResNet50": "resnet50_cat_breed_final.keras",
}

MODELS = {}
for model_name, filename in MODEL_FILES.items():
    try:
        path = get_model_path(filename)
        loaded = load_model_safely(model_name, path)
        if loaded is not None:
            MODELS[model_name] = loaded
    except Exception as e:
        print(f"[FAIL] Unexpected error preparing {model_name}: {e}")

if MODELS:
    print(f"Finished loading models. Available: {list(MODELS.keys())}")
else:
    print("No models could be loaded. /predict will fail until this is fixed.")

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
    if not MODELS:
        return {"error": "No models are currently loaded on the server. Check server logs."}
    if model_name not in MODELS:
        return {"error": f"Invalid model name. Available models: {list(MODELS.keys())}"}
    
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
