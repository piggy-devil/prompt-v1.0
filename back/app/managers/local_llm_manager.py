import os
import logging
from typing import List
from dotenv import load_dotenv
from langchain_ollama import OllamaLLM

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")

class LocalLLMManager:
    _instance = None
    
    # กำหนด model ที่อนุญาตใช้
    ALLOWED_MODELS = [
        "llama3.2",
        "gemma3:4b",
        "qwen3:14b",
        "qwen2.5:7b",
        "qwen2.5:14b",
        "deepseek-r1:1.5b",
    ]
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_llm()
        return cls._instance
    
    def _init_llm(self):
        """Initialize LLM with default settings"""
        self._current_model = None
        self._llm_instance = None
        self.default_model = "llama3.2"
        self.ollama_host = OLLAMA_HOST
    
    @property
    def llm(self) -> OllamaLLM:
        """Lazy initialization of LLM"""
        if self._llm_instance is None:
            self.set_model(self.default_model)
        return self._llm_instance
    
    def set_model(self, model_name: str) -> bool:
        """
        เปลี่ยน LLM model
        
        Args:
            model_name: ชื่อ model ที่ต้องการใช้
            
        Returns:
            bool: True ถ้าสำเร็จ, False ถ้าไม่สำเร็จ
        """
        if model_name not in self.ALLOWED_MODELS:
            logging.warning(f"Model {model_name} is not in allowed models list")
            return False
            
        try:
            self._llm_instance = OllamaLLM(model=model_name, base_url=self.ollama_host)
            self._current_model = model_name
            logging.info(f"Successfully switched to model: {model_name}")
            return True
        except Exception as e:
            logging.error(f"Failed to initialize model {model_name}: {str(e)}")
            # Fallback to default model
            if model_name != self.default_model:
                logging.info(f"Falling back to default model: {self.default_model}")
                return self.set_model(self.default_model)
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return self.ALLOWED_MODELS
    
    def get_current_model(self) -> str:
        """Get currently loaded model name"""
        return self._current_model or self.default_model

# Singleton instance
llm_manager = LocalLLMManager()