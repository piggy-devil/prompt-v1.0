import fitz  # PyMuPDF
from app.documents.file_markdown import law_markdown_transform

def detect_document_type_from_file(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    first_page = doc.load_page(0).get_text()

    # Clean text for matching
    first_page_text = first_page.strip().replace("\u200b", "").replace("\n", " ")

    # แยกข้อความเป็นคำและเอา 50 คำแรก
    words = first_page_text.split()
    first_300_words = ' '.join(words[:50])

    if "พระราชบัญญัติ" in first_300_words:
        return "พระราชบัญญัติ"
    elif "บันทึกข้อความ" in first_300_words:
        return "บันทึกข้อความ"
    elif "ประกาศ" in first_300_words:
        return "ประกาศ"
    elif "คำสั่ง" in first_300_words:
        return "คำสั่ง"
    elif "ระเบียบ" in first_300_words:
        return "ระเบียบ"
    else:
        return "ไม่สามารถระบุได้"
    
def detect_document_type_from_text(text: str) -> str:
    text = text.strip().replace("\u200b", "").replace("\n", " ")
    # เอาแค่ 300 ตัวอักษรแรก
    # first_page = first_page_text[:300]

    if "พระราชบัญญัติ" in text:
        return "พระราชบัญญัติ"
    elif "บันทึกข้อความ" in text:
        return "บันทึกข้อความ"
    elif "ประกาศ" in text:
        return "ประกาศ"
    elif "คำสั่ง" in text:
        return "คำสั่ง"
    elif "ระเบียบ" in text:
        return "ระเบียบ"
    else:
        return "ไม่สามารถระบุได้"
    

from typing import Literal

# หมวดหมู่เอกสารที่รองรับ
DocumentType = Literal["law", "memo", "announcement", "article", "unknown"]

def detect_document_type(text: str) -> DocumentType:
    """
    ตรวจสอบประเภทเอกสารจากข้อความที่อัปโหลด
    """
    lowered = text[:200].lower()  # พิจารณาแค่ช่วงต้นของเอกสาร

    if "พระราชบัญญัติ" in lowered or "มาตรา" in lowered:
        return "law"
    elif "บันทึกข้อความ" in lowered or "ส่วนราชการ" in lowered:
        return "memo"
    elif "ประกาศ" in lowered:
        return "announcement"
    elif "บทความ" in lowered or "อ้างอิง" in lowered:
        return "article"
    else:
        return "unknown"
    
def route_markdown_transform(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    first_page = doc.load_page(0).get_text()

    # Clean text for matching
    text = first_page.strip().replace("\u200b", "").replace("\n", " ")
    doc_type = detect_document_type(text)

    markdown = ""

    if doc_type == "law":
        markdown = law_markdown_transform(pdf_path)  # แยกตามมาตรา
    # elif doc_type == "memo":
    #     return memo_markdown_transform(text)  # แยกตามหัวข้อราชการ
    # elif doc_type == "announcement":
    #     return announcement_markdown_transform(text)  # มีเลขประกาศ
    # elif doc_type == "article":
    #     return article_markdown_transform(text)  # Markdown ธรรมดา
    # else:
    #     print("⚠️ ไม่สามารถระบุประเภทเอกสารได้ ส่งแบบ default")
    #     return default_markdown_transform(text)

    return markdown, doc_type
