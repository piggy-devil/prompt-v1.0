from typing import Literal
from langchain.memory import ConversationBufferWindowMemory

MEMORY_WINDOW = 12 # จำนวน message ที่คงไว้ใน memory

class MemoryManager:
    def __init__(self):
        # memory_stores[user_id][chat_session_id][mode] = memory
        self.memory_stores: dict[str, dict[str, dict[str, ConversationBufferWindowMemory]]] = {}
        # summary_store[user_id][chat_session_id][mode] = summary_str
        self.summary_store: dict[str, dict[str, dict[str, str]]] = {}

    def get_memories(
        self,
        user_id: str,
        chat_session_id: str,
        mode: Literal["general", "welfare", "law", "unknown"]
    ) -> ConversationBufferWindowMemory:
        """ดึงหรือสร้าง ConversationBufferWindowMemory สำหรับ session"""
        self.memory_stores.setdefault(user_id, {})
        self.memory_stores[user_id].setdefault(chat_session_id, {})
        if mode not in self.memory_stores[user_id][chat_session_id]:
            self.memory_stores[user_id][chat_session_id][mode] = ConversationBufferWindowMemory(
                k=MEMORY_WINDOW,
                return_messages=True
            )
        return self.memory_stores[user_id][chat_session_id][mode]

    def get_summary(self, user_id: str, chat_session_id: str, mode: str) -> str:
        """ดึง summary สำหรับ session"""
        return self.summary_store.get(user_id, {}).get(chat_session_id, {}).get(mode, "")
    
    def set_summary(self, user_id: str, chat_session_id: str, mode: str, summary: str):
        """บันทึก summary สำหรับ session"""
        if user_id not in self.summary_store:
            self.summary_store.setdefault(user_id, {})
        if chat_session_id not in self.summary_store[user_id]:
            self.summary_store[user_id].setdefault(chat_session_id, {})
        
        self.summary_store[user_id][chat_session_id][mode] = summary

    def clear_session_memory(
        self,
        user_id: str,
        chat_session_id: str,
        mode: str | None = None
    ) -> bool:
        """ลบ memory ของ session
        - ถ้า mode ถูกระบุ → ลบเฉพาะ mode นั้น
        - ถ้า mode=None → ลบทั้ง session
        Return: True ถ้าลบสำเร็จ, False ถ้ายังมีข้อมูลเหลือ
        """
        print(f"[MEMORY] Request to clear: user_id={user_id}, session_id={chat_session_id}, mode={mode}")

        # ลบจาก memory_stores
        if user_id in self.memory_stores and chat_session_id in self.memory_stores[user_id]:
            if mode:
                removed = self.memory_stores[user_id][chat_session_id].pop(mode, None)
                if removed:
                    print(f"[MEMORY] Removed from memory_stores: mode={mode}")
            else:
                self.memory_stores[user_id].pop(chat_session_id, None)
                print("[MEMORY] Removed entire session from memory_stores")

        # ลบจาก summary_store
        if user_id in self.summary_store and chat_session_id in self.summary_store[user_id]:
            if mode:
                removed = self.summary_store[user_id][chat_session_id].pop(mode, None)
                if removed:
                    print(f"[MEMORY] Removed from summary_store: mode={mode}")
            else:
                self.summary_store[user_id].pop(chat_session_id, None)
                print("[MEMORY] Removed entire session from summary_store")

        # ตรวจสอบหลังลบ
        still_exists = self.has_session_memory(user_id, chat_session_id, mode)
        if still_exists:
            print(f"[MEMORY] WARNING: Session not fully cleared → still exists!")
        else:
            print(f"[MEMORY] SUCCESS: Session cleared successfully")

        return not still_exists
    
    def has_session_memory(
        self,
        user_id: str,
        chat_session_id: str,
        mode: str | None = None
    ) -> bool:
        """ตรวจสอบว่า session หรือ mode ยังมี memory/summary อยู่ไหม"""
        # ตรวจใน memory_stores
        if user_id in self.memory_stores and chat_session_id in self.memory_stores[user_id]:
            if mode:
                if mode in self.memory_stores[user_id][chat_session_id]:
                    return True
            else:
                if self.memory_stores[user_id][chat_session_id]:
                    return True

        # ตรวจใน summary_store
        if user_id in self.summary_store and chat_session_id in self.summary_store[user_id]:
            if mode:
                if mode in self.summary_store[user_id][chat_session_id]:
                    return True
            else:
                if self.summary_store[user_id][chat_session_id]:
                    return True

        return False


