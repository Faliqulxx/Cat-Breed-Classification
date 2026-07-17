import os
import urllib.request

MODELS_DIR = "models"
MODELS = [
    "cnn_scratch_cat_breed_final.keras",
    "mobilenetv2_cat_breed_final.keras",
    "resnet50_cat_breed_final.keras"
]

def download_if_lfs_pointer():
    os.makedirs(MODELS_DIR, exist_ok=True)
    for filename in MODELS:
        filepath = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(filepath) or os.path.getsize(filepath) < 1024:
            print(f"File {filepath} is an LFS pointer or missing. Downloading from GitHub...")
            url = f"https://media.githubusercontent.com/media/Faliqulxx/Cat-Breed-Classification/main/backend/models/{filename}"
            urllib.request.urlretrieve(url, filepath)
            print(f"Downloaded {filename} successfully.")

if __name__ == "__main__":
    download_if_lfs_pointer()
