import uuid
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal, Optional
from fastapi.responses import StreamingResponse
# from langchain.memory import ConversationBufferWindowMemory
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
# from app.routers.search import perform_search
from app.managers.local_llm_manager import llm_manager
from fastapi import APIRouter, HTTPException
from app.managers.db_manager import db_manager, get_unique_parent_id_with_score, search_chunk_by_parent_id
from app.managers.memory_manager import MEMORY_WINDOW
from app.managers import memory_manager  # ใช้ global instance เดียวกัน
from app.prompts.classifier_prompts import build_classification_prompt
from app.prompts.expert_prompts import INSTRUCTIONS, FALLBACK_INSTRUCTION, base_prompt

router = APIRouter()

# ------------------------------
# Config
# ------------------------------
SUMMARY_TRIGGER_LEN = 12  # จำนวน message ก่อนสรุป
# MEMORY_WINDOW = 12  # จำนวน message ที่คงไว้ใน memory

# ------------------------------
# In-memory stores
# ------------------------------
# memory_store: dict[str, dict[str, ConversationBufferWindowMemory]] = {}
# memory_stores: dict[str, dict[str, ConversationBufferWindowMemory]] = {}
# summary_store: dict[str, dict[str, str]] = {}  # summary_store[user_id][mode] = str

# โครงสร้าง: memory_stores[user_id][chat_session_id][mode] = memory
# memory_stores: dict[str, dict[str, dict[str, ConversationBufferWindowMemory]]] = {}
# โครงสร้าง: summary_store[user_id][chat_session_id][mode] = summary_str
# summary_store: dict[str, dict[str, dict[str, str]]] = {}

# สร้าง instance In-memory stores

# ------------------------------
# Request model
# ------------------------------
class SearchRequest(BaseModel):
    prompt: str
    # collection_name: str = "thai_law_hybrid"
    l_search: int = 15
    l_chunk: int = 20
    model: str | None = "llama3.2"
    user_id: str | None = None
    chat_session_id: str | None = None

# ------------------------------
# Memory functions
# ------------------------------

# --------- memory หลายผู้ใช้ (ใน-memory store) ---------
# def get_memory(user_id: str) -> ConversationBufferWindowMemory:
#     if user_id not in memory_store:
#         memory_store[user_id] = ConversationBufferWindowMemory(k=5, return_messages=True)
#     return memory_store[user_id]

# def get_memories(user_id: str, mode: Literal["general", "welfare", "law", "unknown"]) -> ConversationBufferWindowMemory:
#     if user_id not in memory_stores:
#         memory_stores[user_id] = {}
#     if mode not in memory_stores[user_id]:
#         memory_stores[user_id][mode] = ConversationBufferWindowMemory(k=MEMORY_WINDOW, return_messages=True)
#     return memory_stores[user_id][mode]

# def get_summary(user_id: str, mode: str) -> str:
#     return summary_store.get(user_id, {}).get(mode, "")

# def set_summary(user_id: str, mode: str, summary: str):
#     if user_id not in summary_store:
#         summary_store[user_id] = {}
#     summary_store[user_id][mode] = summary

# def get_memories(
#     user_id: str,
#     chat_session_id: str,
#     mode: Literal["general", "welfare", "law", "unknown"]
# ) -> ConversationBufferWindowMemory:
#     if user_id not in memory_stores:
#         memory_stores[user_id] = {}
#     if chat_session_id not in memory_stores[user_id]:
#         memory_stores[user_id][chat_session_id] = {}
#     if mode not in memory_stores[user_id][chat_session_id]:
#         memory_stores[user_id][chat_session_id][mode] = ConversationBufferWindowMemory(
#             k=MEMORY_WINDOW,
#             return_messages=True
#         )
#     return memory_stores[user_id][chat_session_id][mode]

# def get_summary(user_id: str, chat_session_id: str, mode: str) -> str:
#     return summary_store.get(user_id, {}).get(chat_session_id, {}).get(mode, "")

# def set_summary(user_id: str, chat_session_id: str, mode: str, summary: str):
#     if user_id not in summary_store:
#         summary_store[user_id] = {}
#     if chat_session_id not in summary_store[user_id]:
#         summary_store[user_id][chat_session_id] = {}
#     summary_store[user_id][chat_session_id][mode] = summary

# def set_prompt_expert(expert: str, context: str, history_str: str, user_question: str):
#     prompt_rag = f"""คุณคือผู้เชี่ยวชาญด้าน{expert} ช่วยให้คำตอบจาก{expert}อย่างชัดเจน

# บริบทจากเอกสาร:
# {context}

# ประวัติการสนทนา:
# {history_str}

# คำถาม: {user_question}
# กรุณาตอบอย่างกระชับ พร้อมอ้างอิงมาตราที่เกี่ยวข้อง:

# หากได้รับคำขอ "แบบฟอร์ม" ที่มีใน RAG เช่น แบบฟอร์มลาพักร้อน แบบฟอร์มลากิจ ฯลฯ  
# ให้เขียนเป็น Markdown link ตัวอย่างเช่น:

# 📎 [แบบฟอร์มลาพักร้อน](https://yourdomain.com/forms/leave_form_vacation.pdf)

# อย่าแสดง URL เปล่า เช่น `https://...` โดยไม่มีข้อความลิงก์

# กรุณาใช้รูปแบบนี้ทุกครั้งที่คุณแนะนำลิงก์สำหรับดาวน์โหลดเอกสาร
# และไม่ต้องพยายามแปลงอักขระพิเศษใดๆ ที่อยู่ใน url ให้ใช้ตามที่ค้นเจอเลย
# """
#     return prompt_rag

def set_prompt_expert(expert: str, context: str, history: str, question: str) -> str:
    """
    เลือก instruction ตาม expert แล้วสร้าง prompt ผ่าน base template
    ถ้าไม่รู้จัก expert จะ fallback เป็น generic helper
    """
    instruction = INSTRUCTIONS.get(expert, FALLBACK_INSTRUCTION)
    expert_name = expert if expert in INSTRUCTIONS else "ทั่วไป"
    
    return base_prompt(expert_name, instruction, context, history, question)

# ------------------------------
# Dummy classify function
# ------------------------------
GREETING_KEYWORDS = ["สวัสดี", "ขอบคุณ", "บาย", "ทดสอบ", "hello", "hi", "คุณชื่ออะไร"]

def is_general_question(prompt: str) -> bool:
    return any(word in prompt.lower() for word in GREETING_KEYWORDS)

async def classify_question_type(prompt: str) -> Literal["ทั่วไป", "กฎหมาย", "สวัสดิการ", "แบบฟอร์ม"]:
    
    if (is_general_question(prompt)):
        return "ทั่วไป"
    
    few_shot_prompt = build_classification_prompt(prompt)

    result = ""
    async for chunk in llm_manager.llm.astream(few_shot_prompt):
        result += chunk

    if "ทั่วไป" in result:
        return "ทั่วไป"
    elif "สวัสดิการ" in result:
        return "สวัสดิการ"
    else:
        return "กฎหมาย"


# ------------------------------
# Summarization function
# ------------------------------
async def summarize_history(history: list) -> str:
    conversation = "\n".join([
        f"User: {msg.content}" if isinstance(msg, HumanMessage) else f"AI: {msg.content}"
        for msg in history
    ])
    prompt = f"""สรุปการสนทนาต่อไปนี้ให้อยู่ในรูปแบบที่เข้าใจง่ายกระชับ:\n\n{conversation}\n\nสรุป:"""

    print('Prompt : ', prompt)
    
    summary = ""
    async for chunk in llm_manager.llm.astream(prompt):
        summary += chunk

    print('\nSummary : ', summary.strip())

    return summary.strip()

# ------------------------------
# Perform Search function
# ------------------------------
async def perform_search(prompt: str, collection_name: str, l_search: int, l_chunk: int):
    try:
        vectorstore = db_manager.get_vectorstore(collection_name)

        # Step 1: ดึง top 15 เพราะอาจมี doc ที่ซ้ำ ดึงเยอะมาก่อน
        result_with_score = vectorstore.similarity_search_with_score(prompt, k=l_search)
        # Step 2: คัด doc จำนวน (l_search) ต้องไม่ซ้ำกัน กรองด้วย parent_id
        unique_docs = get_unique_parent_id_with_score(result_with_score, limit=l_search)

        contexts = []
        for parent_id, chunk in unique_docs.items():
            full_content = search_chunk_by_parent_id(collection_name=collection_name, parent_id=parent_id, limit=l_chunk)
            score = chunk[0][1]
            contexts.append({
                "parent_id": parent_id,
                "score": score,
                "content": full_content
            })

        # print(db_manager.get_embedding("dense").embed_query("การทำงาน"))

        return contexts

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"การค้นหาล้มเหลว: {str(e)}"
        )

# ------------------------------
# Match Form function
# ------------------------------    
def match_form_from_keywords(prompt: str) -> Optional[str]:
    prompt = prompt.lower()
    forms = {
        "ลาพักร้อน": "forms/leave_form_vacation.pdf",
        "ลากิจ": "forms/leave_form_personal.pdf",
        "ลาป่วย": "forms/leave_form_sick.pdf",
        "ลาพักผ่อน": "forms/leave_form_sick.pdf"
    }
    for keyword, path in forms.items():
        if keyword in prompt and ("แบบ" in prompt or "ฟอร์ม" in prompt):
            return f"http://localhost:8000/{path}", keyword
    return None

def markdown_link_from_url(url: str, label: str = "คลิกที่นี่เพื่อดาวน์โหลด") -> str:
    return f"[{label}]({url})"


# ------------------------------
# Main endpoint
# ------------------------------
@router.post("/llm/search-rag-category/chat")
async def search_endpoint(request: SearchRequest):
    if request.model:
        llm_manager.set_model(request.model)

    user_id = request.user_id or str(uuid.uuid4())  # กำหนด user id ถ้าไม่ได้ส่งมา
    chat_session_id = request.chat_session_id or str(uuid.uuid4())  # กำหนด chat_session_id ถ้าไม่ได้ส่งมา
    user_question = request.prompt

    # ------- Classify คำถามก่อน ------
    category = await classify_question_type(user_question)

    print("หมวด : ", category)

    # แยก memory
    if category == "ทั่วไป":
        mode = "general"
    elif category == "สวัสดิการ":
        mode = "welfare"
    elif category == "กฎหมาย":
        mode = "law"
    else:
        mode = "unknown"

    # category = "ทั่วไป"
    
    # memory = get_memory(user_id)
    memory = memory_manager.get_memories(user_id, chat_session_id, mode)

    # Load history & summary
    summary = memory_manager.get_summary(user_id, chat_session_id, mode)

    history = memory.load_memory_variables({})["history"]

    # ------- Load ประวัติจาก memory ------
    history_str = ""
    
    for msg in history:
        if isinstance(msg, HumanMessage):
            history_str += f"User: {msg.content}\n"
        elif isinstance(msg, AIMessage):
            history_str += f"AI: {msg.content}\n"

    # ใส่ summary เข้าไปใน prompt ถ้ามี
    if summary:
        history_str = f"สรุปก่อนหน้า:\n{summary}\n\n{history_str}"

    # ------- คำถามทั่วไป (ไม่ใช้ RAG) ------
    if category == "ทั่วไป":
        # print('summary-general-memory : ', summary)
        # print('history-general-memory : ', history)
        prompt = f"""คุณคือผู้ช่วยตอบคำถามทั่วไปอย่างสุภาพ\n\nประวัติการสนทนา:\n\n{history_str}\n\nคำถาม: {user_question}
\n\nคำตอบ:
**ให้ใช้สรรพนามและคำลงท้ายประโยคด้วยคำว่า "ครับ" เสมอ ไม่ต้องใช้ "ค่ะ" หรือ "ครับ/ค่ะ"**"""
        full_response = ""
        async def stream_general():
            nonlocal full_response
            print("Start streaming general response")
            try:
                async for chunk in llm_manager.llm.astream(prompt):
                    full_response += chunk
                    yield chunk
            except Exception as e:
                print(f"Exception during streaming: {e}")
            finally:
                try:
                    await finalize()
                except Exception as e:
                    print("❌ Error in finalize_rag:", e)
            print("Finished streaming general response")

        async def finalize():
            # เพิ่มข้อความใหม่ใน memory
            memory.chat_memory.add_user_message(user_question)
            memory.chat_memory.add_ai_message(full_response)

            history_now = memory.load_memory_variables({})["history"]

            # เช็คว่าเกินจุด trigger การสรุปหรือยัง
            if len(history_now) >= SUMMARY_TRIGGER_LEN:
                to_summarize = history_now[:-2]
                new_summary = await summarize_history(to_summarize)

                # บันทึกลง summary store
                memory_manager.set_summary(
                    user_id=user_id,
                    chat_session_id=chat_session_id,
                    mode=mode,
                    summary=new_summary
                )

                # อัปเดต SystemMessage ที่เป็น summary แทนที่จะลบ history ทั้งหมด
                msgs = memory.chat_memory.messages
                summary_index = next(
                    (i for i, m in enumerate(msgs) if isinstance(m, SystemMessage) and m.content.startswith("สรุปการสนทนา")),
                    None
                )

                if summary_index is not None:
                    msgs[summary_index] = SystemMessage(content=f"สรุปการสนทนาก่อนหน้า:\n{new_summary}")
                else:
                    msgs.insert(0, SystemMessage(content=f"สรุปการสนทนาก่อนหน้า:\n{new_summary}"))

                memory.chat_memory.messages = msgs

                # his_to = memory.load_memory_variables({})["history"]
                # print('ประวัติการสนทนาหลังจากที่สรุปและลดประวัติการสนทนา : ', his_to)

        # print('instance memory : ',id(memory_stores[user_id]["general"]))
        # print('ประวัติการสนทนา ที่ไม่ได้ใช้ RAG : ', history_str)
        return StreamingResponse(stream_general(), media_type="text/plain")

    # ------- คำถามเชิงเอกสาร (ใช้ RAG) -------

    if (category == "กฎหมาย") :
        collection_name = "thai_law_hybrid"
    elif (category == "สวัสดิการ"):
        collection_name = "welfare"
    else:
        collection_name = "unknown"
        
    data_from_rag = await perform_search(
        prompt=request.prompt, 
        collection_name=collection_name, 
        l_search=request.l_search, 
        l_chunk=request.l_chunk
    )
    filtered_contents = [item["content"] for item in data_from_rag if item["score"] > 0.2]
    context = "\n".join(filtered_contents)

    prompt_rag = set_prompt_expert(category, context, history_str, user_question)

    final_answer = ""
    async def stream_rag():
        nonlocal final_answer
        print("Start streaming rag response")
        try:
            async for chunk in llm_manager.llm.astream(prompt_rag):
                final_answer += chunk
                yield chunk
        except Exception as e:
            print("❌ Error while streaming:", e)
        finally:
            try:
                await finalize_rag()
            except Exception as e:
                print("❌ Error in finalize_rag:", e)
        print("Finished streaming rag response")

        # 🔍 ตรวจว่า user ต้องการฟอร์มหรือไม่
        # form_url, name_form = match_form_from_keywords(user_question)
        # if form_url:
        #     link_text = f"\n\n📎 ดาวน์โหลดแบบฟอร์มที่เกี่ยวข้อง: แบบฟอร์มใบ{markdown_link_from_url(form_url, label=name_form)}\n\n"

        #     final_answer += link_text
        #     yield link_text

    async def finalize_rag():
        # เพิ่มข้อความใหม่ใน memory
        memory.chat_memory.add_user_message(user_question)
        memory.chat_memory.add_ai_message(final_answer)

        history_now = memory.load_memory_variables({})["history"]

        # เช็คว่าเกินจุด trigger การสรุปหรือยัง
        if len(history_now) >= SUMMARY_TRIGGER_LEN:
            to_summarize = history_now[:-2]
            new_summary = await summarize_history(to_summarize)

            # บันทึกลง summary store
            memory_manager.set_summary(
                user_id=user_id,
                chat_session_id=chat_session_id,
                mode=mode,
                summary=new_summary
            )

            # อัปเดต SystemMessage ที่เป็น summary แทนที่จะลบ history ทั้งหมด
            msgs = memory.chat_memory.messages
            summary_index = next(
                (i for i, m in enumerate(msgs) if isinstance(m, SystemMessage) and m.content.startswith("สรุปการสนทนา")),
                None
            )

            if summary_index is not None:
                msgs[summary_index] = SystemMessage(content=f"สรุปการสนทนาก่อนหน้า:\n{new_summary}")
            else:
                msgs.insert(0, SystemMessage(content=f"สรุปการสนทนาก่อนหน้า:\n{new_summary}"))

            memory.chat_memory.messages = msgs

    #         his_to = memory.load_memory_variables({})["history"]
    #         print('ประวัติการสนทนาหลังจากที่สรุปและลดประวัติการสนทนา with RAG : ', his_to)

    # print('summary-rag-memory : ', summary)
    # print('history-rag-memory : ', history)
    # print('instance memory : ',id(memory_stores[user_id]["rag"]))
    # print('ประวัติการสนทนา มี RAG : ', history_str)
    return StreamingResponse(stream_rag(), media_type="text/plain")