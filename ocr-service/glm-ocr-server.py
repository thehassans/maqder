"""
GLM-OCR Standalone API Server for Maqder ERP
Compatible with OpenAI Chat Completions API format.

Requirements:
pip install fastapi uvicorn transformers torch pillow
"""

from fastapi import FastAPI, Request
import uvicorn
import base64
from io import BytesIO
from PIL import Image
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

MODEL_NAME = "zai-org/GLM-OCR"

logger.info(f"Loading {MODEL_NAME}...")
# Note: In a real production deployment, consider using vLLM or SGLang for better performance.
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, trust_remote_code=True, torch_dtype=torch.float16).cuda()
    model.eval()
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.warning(f"Could not load model: {e}")
    model = None
    tokenizer = None

def process_image(url: str):
    if url.startswith("data:"):
        base64_data = url.split(",")[1]
        image_data = base64.b64decode(base64_data)
        return Image.open(BytesIO(image_data)).convert('RGB')
    raise ValueError("Unsupported image URL format")

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    
    prompt = ""
    images = []
    
    for message in messages:
        if isinstance(message.get("content"), str):
            prompt += message["content"] + "\n"
        elif isinstance(message.get("content"), list):
            for content_block in message["content"]:
                if content_block.get("type") == "text":
                    prompt += content_block.get("text", "") + "\n"
                elif content_block.get("type") == "image_url":
                    images.append(process_image(content_block["image_url"]["url"]))

    if not model:
        # Mock response if model is not loaded
        return {
            "choices": [{
                "message": {
                    "content": json.dumps({"measurements": {"chest": 50, "length": 150}, "notes": "Model not loaded, mock response."})
                }
            }]
        }

    try:
        # GLM-V input processing
        inputs = model.build_conversation_input_ids(tokenizer, query=prompt, history=[], images=images)
        inputs = {k: v.unsqueeze(0).cuda() for k, v in inputs.items()}
        
        outputs = model.generate(**inputs, max_new_tokens=1024, temperature=0.1)
        response_text = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        
        return {
            "choices": [{
                "message": {
                    "content": response_text
                }
            }]
        }
    except Exception as e:
        logger.error(f"Inference error: {e}")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
