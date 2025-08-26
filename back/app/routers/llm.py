import os
import requests
from fastapi import APIRouter, Response
from pydantic import BaseModel
from typing import AsyncGenerator
from app.managers.local_llm_manager import llm_manager  # นำเข้า Singleton

from dotenv import load_dotenv

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")

router = APIRouter()

# === Request Schema ===
class PromptRequest(BaseModel):
    prompt: str
    model: str | None = "llama3.2"

# === 1. Synchronous Usage ===
@router.post("/llm/sync")
def run_llm_sync(request: PromptRequest):
    if request.model:
        llm_manager.set_model(request.model)
    response = llm_manager.llm.invoke(request.prompt)
    # return {"response": response}
    return response

@router.get('/ask')
def ask(prompt :str):
    res = requests.post(f"{OLLAMA_HOST}/api/generate", json={
        "prompt": prompt,
        "stream" : False,
        "model" : "llama3.2"
    })

    return Response(content=res.text, media_type="application/json")