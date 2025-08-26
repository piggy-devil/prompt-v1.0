from fastapi import APIRouter
from pydantic import BaseModel
from app.managers import memory_manager  # ใช้ global instance เดียวกัน

router = APIRouter()

class DeleteChatRequest(BaseModel):
    user_id: str
    chat_session_id: str
    mode: str | None = None 

@router.delete("/chat/delete")
def delete_chat(req: DeleteChatRequest):
    success = memory_manager.clear_session_memory(req.user_id, req.chat_session_id, req.mode)
    return {"status": "ok" if success else "failed"}

@router.get("/chat/exists")
def check_chat_exists(user_id: str, chat_session_id: str, mode: str | None = None):
    exists = memory_manager.has_session_memory(user_id, chat_session_id, mode)
    return {"exists": exists}