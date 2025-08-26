from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat_session, upload, search_rag, llm

# --- FastAPI app ---
app = FastAPI(title="RAG and Chat API Service")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm.router, prefix="/apib")
app.include_router(upload.router, prefix="/apib")
app.include_router(search_rag.router, prefix="/apib")
app.include_router(chat_session.router, prefix="/apib")