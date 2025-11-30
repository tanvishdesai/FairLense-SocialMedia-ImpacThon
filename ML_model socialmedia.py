import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import matplotlib.pyplot as plt

# ==========================================
# Configuration
# ==========================================
DATASET_PATH = "./dataset" # Folder containing images and dataset.csv
CSV_FILE = os.path.join(DATASET_PATH, "dataset.csv")
IMAGES_DIR = os.path.join(DATASET_PATH, "images")
MODEL_SAVE_PATH = "bias_classifier_head.pth"
BATCH_SIZE = 16
EPOCHS = 10
LEARNING_RATE = 0.001
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLIP_MODEL_ID = "openai/clip-vit-base-patch32"

# ==========================================
# 1. Data Loading & Preprocessing
# ==========================================

class MultimodalDataset(Dataset):
    def __init__(self, dataframe, img_dir, processor):
        self.df = dataframe
        self.img_dir = img_dir
        self.processor = processor
        
    def __len__(self):
        return len(self.df)
    
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.img_dir, row['image_path'])
        caption = row['caption']
        label = row['label'] # 0: Neutral, 1: Biased
        
        try:
            image = Image.open(img_path).convert("RGB")
        except:
            # Dummy image if not found
            image = Image.new("RGB", (224, 224), color='gray')
            
        # Process with CLIP Processor
        inputs = self.processor(text=[caption], images=image, return_tensors="pt", padding=True)
        
        # Remove batch dimension added by processor
        return {
            'pixel_values': inputs['pixel_values'].squeeze(0),
            'input_ids': inputs['input_ids'].squeeze(0),
            'attention_mask': inputs['attention_mask'].squeeze(0),
            'label': torch.tensor(label, dtype=torch.float32)
        }

def load_data():
    if not os.path.exists(CSV_FILE):
        print(f"Warning: {CSV_FILE} not found. Generating dummy data.")
        os.makedirs(IMAGES_DIR, exist_ok=True)
        data = {
            'image_path': [f'img_{i}.jpg' for i in range(20)],
            'caption': [f'Caption {i}' for i in range(20)],
            'label': [i % 2 for i in range(20)]
        }
        df = pd.DataFrame(data)
        # Create dummy images
        for name in df['image_path']:
            Image.new('RGB', (100, 100)).save(os.path.join(IMAGES_DIR, name))
    else:
        df = pd.read_csv(CSV_FILE)
        
    train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)
    return train_df, val_df

# ==========================================
# 2. Model Architecture (CLIP + Classifier)
# ==========================================

class BiasClassifier(nn.Module):
    def __init__(self, clip_model):
        super(BiasClassifier, self).__init__()
        self.clip = clip_model
        # Freeze CLIP
        for param in self.clip.parameters():
            param.requires_grad = False
            
        # CLIP embedding dim is 512 for ViT-B/32
        self.classifier = nn.Sequential(
            nn.Linear(512 * 2, 256), # Image + Text embeddings concatenated
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
        
    def forward(self, pixel_values, input_ids, attention_mask):
        # Get CLIP embeddings
        with torch.no_grad():
            vision_outputs = self.clip.get_image_features(pixel_values=pixel_values)
            text_outputs = self.clip.get_text_features(input_ids=input_ids, attention_mask=attention_mask)
            
        # Normalize embeddings
        vision_outputs = vision_outputs / vision_outputs.norm(p=2, dim=-1, keepdim=True)
        text_outputs = text_outputs / text_outputs.norm(p=2, dim=-1, keepdim=True)
        
        # Concatenate
        combined = torch.cat((vision_outputs, text_outputs), dim=1)
        
        # Classify
        output = self.classifier(combined)
        return output

# ==========================================
# 3. Training & Evaluation
# ==========================================

def train_model():
    # Setup
    processor = CLIPProcessor.from_pretrained(CLIP_MODEL_ID)
    clip_model = CLIPModel.from_pretrained(CLIP_MODEL_ID).to(DEVICE)
    
    train_df, val_df = load_data()
    
    train_dataset = MultimodalDataset(train_df, IMAGES_DIR, processor)
    val_dataset = MultimodalDataset(val_df, IMAGES_DIR, processor)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    model = BiasClassifier(clip_model).to(DEVICE)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=LEARNING_RATE)
    
    # Training Loop
    train_losses = []
    print("Starting Training...")
    
    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0
        
        for batch in train_loader:
            pixel_values = batch['pixel_values'].to(DEVICE)
            input_ids = batch['input_ids'].to(DEVICE)
            attention_mask = batch['attention_mask'].to(DEVICE)
            labels = batch['label'].to(DEVICE).unsqueeze(1)
            
            optimizer.zero_grad()
            outputs = model(pixel_values, input_ids, attention_mask)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        avg_loss = epoch_loss / len(train_loader)
        train_losses.append(avg_loss)
        print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {avg_loss:.4f}")
        
    # Save Model Head
    torch.save(model.classifier.state_dict(), MODEL_SAVE_PATH)
    print(f"Classifier head saved to {MODEL_SAVE_PATH}")
    
    # Evaluation
    model.eval()
    y_true = []
    y_pred = []
    
    with torch.no_grad():
        for batch in val_loader:
            pixel_values = batch['pixel_values'].to(DEVICE)
            input_ids = batch['input_ids'].to(DEVICE)
            attention_mask = batch['attention_mask'].to(DEVICE)
            labels = batch['label'].to(DEVICE).unsqueeze(1)
            
            outputs = model(pixel_values, input_ids, attention_mask)
            preds = (outputs > 0.5).float()
            
            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())
            
    print("Validation Report:")
    print(classification_report(y_true, y_pred))
    
    # Graph
    plt.figure()
    plt.plot(train_losses)
    plt.title('Training Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.savefig('training_loss.png')
    print("Loss graph saved to training_loss.png")

if __name__ == "__main__":
    train_model()
