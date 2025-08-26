import os
import fitz  # PyMuPDF
import re
import unicodedata
from pathlib import Path
from typing import Optional

from langchain_core.documents import Document

# รวม metadata
def clean_markdown_and_thai_digits_all(documents: list[Document]) -> list[Document]:
    def thai_digit_to_arabic(text: str) -> str:
        return text.translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))

    def convert_metadata(metadata: dict) -> dict:
        new_metadata = {}
        for k, v in metadata.items():
            if isinstance(v, str):
                new_metadata[k] = thai_digit_to_arabic(v)
            else:
                new_metadata[k] = v  # ไม่แปลง field ที่ไม่ใช่ string
        return new_metadata

    cleaned_docs = []

    for doc in documents:
        cleaned_text = thai_digit_to_arabic(remove_markdown_headers(doc.page_content))
        cleaned_meta = convert_metadata(doc.metadata)
        cleaned_docs.append(Document(page_content=cleaned_text, metadata=cleaned_meta))

    return cleaned_docs

# ไม่รวม metadata
def clean_markdown_and_thai_digits(documents: list[Document]) -> list[Document]:
    cleaned_docs = []

    for doc in documents:
        text = remove_markdown_headers(doc.page_content)
        text = thai_digit_to_arabic(text)
        cleaned_docs.append(Document(page_content=text, metadata=doc.metadata))

    return cleaned_docs

def remove_markdown_headers(text: str) -> str:
    # ลบเฉพาะ `#`, `##`, ..., `######` ที่ต้นบรรทัด พร้อมช่องว่างหลัง #
    return re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)

def read_markdown_file(file_path: str) -> str:
    path = Path(file_path)
    if not path.exists():
        print(f"❗ ไฟล์ไม่พบ: {file_path}")
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"❗ อ่านไฟล์ไม่สำเร็จ: {e}")
        return ""
    
def thai_digit_to_arabic(text: str) -> str:
    thai_to_arabic = str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789")
    return text.translate(thai_to_arabic)

def thai_digit_to_int(thai_num: str) -> int:
    digit_map = {'๐': '0','๑': '1','๒': '2','๓': '3','๔': '4','๕': '5','๖': '6','๗': '7','๘': '8','๙': '9'}
    return int(''.join(digit_map.get(ch, ch) for ch in thai_num))

def extract_matra_number(text: str) -> Optional[int]:
    m = re.match(r"^มาตรา\s+([๐๑๒๓๔๕๖๗๘๙\d]+)", clean_line(text))
    return thai_digit_to_int(m.group(1)) if m else None

def clean_line(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[\u200B\u00A0\u202F]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def is_matra_number_only_line(line: str) -> bool:
    line = clean_line(line)
    return bool(re.fullmatch(r"[๐๑๒๓๔๕๖๗๘๙\d]{1,4}", line))

def extract_standalone_matra(line: str) -> str | None:
    """ดึงเฉพาะบรรทัดที่มีแต่มาตรา + เลข ไม่มีเนื้อหาต่อท้าย"""
    line = clean_line(line)
    m = re.fullmatch(r"(มาตรา\s+[๐๑๒๓๔๕๖๗๘๙\d]+(?:/[๐๑๒๓๔๕๖๗๘๙\d]+)?(?: ทวิ| ตรี| จัตวา)?)", line)
    return m.group(1) if m else None

def extract_matra_at_line_start(line: str) -> str | None:
    """ดึงมาตราที่อยู่ต้นบรรทัด + มีข้อความต่อท้าย"""
    line = clean_line(line)
    m = re.match(r"^(มาตรา\s+[๐๑๒๓๔๕๖๗๘๙\d]+(?:/[๐๑๒๓๔๕๖๗๘๙\d]+)?(?: ทวิ| ตรี| จัตวา)?)\b", line)
    return m.group(1) if m and len(m.group(0)) >= 7 else None

def detect_royal_gazette_header(lines: list[str]) -> Optional[int]:
    """
    ตรวจจับตำแหน่งเริ่มต้นของหัวราชกิจจานุเบกษา (หน้า + เล่ม + ราชกิจ + วันที่)
    คืน index เริ่มต้น (4 บรรทัด) หากเจอ
    """
    page_line_pattern = r"^หน้า\s+[๐-๙\d]+$"
    header_pattern = r"""
    ^เล่ม\s+[๐-๙\d]+\s+ตอนที่\s+[๐-๙\d]+(?:\s+[ก-ฮ])?\s+
    ราชกิจจานุเบกษา\s+
    [๐-๙\d]+\s+[ก-๙]+\s+[๐-๙\d]{4}$
    """

    for i in range(len(lines) - 3):
        # ตรวจว่าบรรทัดแรกเป็น "หน้า ..."
        if re.fullmatch(page_line_pattern, lines[i].strip()):
            # รวม 3 บรรทัดถัดไป
            combined = f"{lines[i+1].strip()} {lines[i+2].strip()} {lines[i+3].strip()}"
            if re.fullmatch(header_pattern, combined, flags=re.VERBOSE):
                return i  # เริ่มลบตั้งแต่ "หน้า ..."

    # รองรับกรณีไม่มี "หน้า ..." (ใช้แค่ 3 บรรทัด)
    for i in range(len(lines) - 2):
        combined = f"{lines[i].strip()} {lines[i+1].strip()} {lines[i+2].strip()}"
        if re.fullmatch(header_pattern, combined, flags=re.VERBOSE):
            return i  # เริ่มลบที่บรรทัดแรกของหัวราชกิจฯ

    return None

def pdf_to_markdown(pdf_path: str, mark_type: str, output_dir: str = "extracted_md") -> str:
    doc = fitz.open(pdf_path)
    filename = os.path.splitext(os.path.basename(pdf_path))[0]
    md_path = os.path.join(output_dir, f"{filename}.md")
    os.makedirs(output_dir, exist_ok=True)

    buffer_line = None
    previous_matra = None
    first_line_mark_type = 0

    with open(md_path, "w", encoding="utf-8") as f:
        for page in doc:
            lines = page.get_text().splitlines()
            i = 0

            # 🧹 ลบหัวราชกิจจานุเบกษา (ถ้ามีในหน้านี้)
            header_index = detect_royal_gazette_header(lines)
            if header_index is not None:
                del lines[header_index:header_index + 4 if lines[header_index].startswith("หน้า") else header_index + 3]

            while i < len(lines):
                raw_line = lines[i]
                line = clean_line(raw_line)

                # if line.startswith("หน้า"):
                #     i += 1
                #     continue

                # markdown ชนิดของเอกสาร ทำแค่หน้าแรกครั้งเดียว
                if page.number == 0 and line.startswith(mark_type):
                    if (first_line_mark_type == 0):
                        f.write(f"# {mark_type}\n\n")
                        first_line_mark_type = 1
                        i += 1
                        continue

                # รวมหมวด + ชื่อ
                if buffer_line:
                    full = f"{buffer_line} {line}"
                    if buffer_line.startswith("หมวด"):
                        f.write(f"## {full}\n\n")
                    elif buffer_line.startswith("ส่วนที่"):
                        f.write(f"### {full}\n\n")
                    buffer_line = None
                    i += 1
                    continue

                if re.fullmatch(r"หมวด\s+[๐๑๒๓๔๕๖๗๘๙\d]+", line):
                    buffer_line = line
                    i += 1
                    continue

                if line.startswith("ส่วนที่"):
                    buffer_line = line
                    i += 1
                    continue

                # ✅ มาตราอยู่คนละบรรทัด: "มาตรา", "๑"
                if line == "มาตรา" and i + 1 < len(lines) and is_matra_number_only_line(lines[i + 1]):
                    full = f"มาตรา {clean_line(lines[i + 1])}"
                    number = extract_matra_number(full)
                    if previous_matra is None or (number == previous_matra + 1):
                        previous_matra = number
                        f.write(f"#### {full}\n\n")
                        i += 2
                        continue

                # # ✅ มาตรา
                matra_text = extract_standalone_matra(line)
                if matra_text:
                    number = extract_matra_number(matra_text)
                    if previous_matra is None or (number == previous_matra + 1):
                        f.write(f"#### {matra_text}\n\n")
                        previous_matra = number
                        after = line[len(matra_text):].strip()
                        if after:
                            f.write(after + "\n\n")
                        i += 1
                        continue

                # ✅ มาตราหลักร้อย
                partial = extract_matra_at_line_start(line)
                if partial:
                    number = extract_matra_number(partial)
                    if previous_matra is None or (number == previous_matra + 1):
                        f.write(f"#### {partial}\n\n")
                        previous_matra = number
                        after = line[len(partial):].strip()
                        if after:
                            f.write(after + "\n\n")
                        i += 1
                        continue

                # ✅ หัวเรื่องอื่นๆ
                if any(line.startswith(h) for h in ["บทเฉพาะกาล", "บทนิยาม", "บทกำหนดโทษ"]):
                    f.write(f"## {line}\n\n")
                    i += 1
                    continue

                # ✅ เนื้อหาทั่วไป
                f.write(line + "\n\n")
                i += 1

    return md_path

def clean_markdown_file(md_path: str):
    with open(md_path, "r+", encoding="utf-8") as f:
        content = f.read()

        # 🔹 1. ลบช่องว่างท้ายบรรทัด
        content = re.sub(r"[ \t]+(\n)", r"\1", content)

        # 🔹 2. ลบบรรทัดที่มีแต่ space/tab
        content = re.sub(r"^[ \t]*\n", "\n", content, flags=re.MULTILINE)

        # 🔹 3. ลด \n มากกว่า 1 ให้เหลือแค่ \n
        content = re.sub(r"\n{2,}", "\n", content)

        # ✏️ เขียนกลับไฟล์
        f.seek(0)
        f.write(content.strip())
        f.truncate()
        
# def law_markdown_transform(text: str, filename: str):
def law_markdown_transform(pdf_path: str, mark_type: str = "พระราชบัญญัติ", output_dir: str = "extracted_md") -> str:

    doc = fitz.open(pdf_path)
    filename = os.path.splitext(os.path.basename(pdf_path))[0]
    md_path = os.path.join(output_dir, f"{filename}.md")
    os.makedirs(output_dir, exist_ok=True)

    buffer_line = None
    previous_matra = None
    first_line_mark_type = 0

    with open(md_path, "w", encoding="utf-8") as f:
        for page in doc:
            lines = page.get_text().splitlines()
            i = 0

            # 🧹 ลบหัวราชกิจจานุเบกษา (ถ้ามีในหน้านี้)
            header_index = detect_royal_gazette_header(lines)
            if header_index is not None:
                del lines[header_index:header_index + 4 if lines[header_index].startswith("หน้า") else header_index + 3]

            while i < len(lines):
                raw_line = lines[i]
                line = clean_line(raw_line)

                # if line.startswith("หน้า"):
                #     i += 1
                #     continue

                # markdown ชนิดของเอกสาร ทำแค่หน้าแรกครั้งเดียว
                if page.number == 0 and line.startswith(mark_type):
                    if (first_line_mark_type == 0):
                        f.write(f"# {mark_type}\n\n")
                        first_line_mark_type = 1
                        i += 1
                        continue

                # รวมหมวด + ชื่อ
                if buffer_line:
                    full = f"{buffer_line} {line}"
                    if buffer_line.startswith("หมวด"):
                        f.write(f"## {full}\n\n")
                    elif buffer_line.startswith("ส่วนที่"):
                        f.write(f"### {full}\n\n")
                    buffer_line = None
                    i += 1
                    continue

                if re.fullmatch(r"หมวด\s+[๐๑๒๓๔๕๖๗๘๙\d]+", line):
                    buffer_line = line
                    i += 1
                    continue

                if line.startswith("ส่วนที่"):
                    buffer_line = line
                    i += 1
                    continue

                # ✅ มาตราอยู่คนละบรรทัด: "มาตรา", "๑"
                if line == "มาตรา" and i + 1 < len(lines) and is_matra_number_only_line(lines[i + 1]):
                    full = f"มาตรา {clean_line(lines[i + 1])}"
                    number = extract_matra_number(full)
                    if previous_matra is None or (number == previous_matra + 1):
                        previous_matra = number
                        f.write(f"#### {full}\n\n")
                        i += 2
                        continue

                # # ✅ มาตรา
                matra_text = extract_standalone_matra(line)
                if matra_text:
                    number = extract_matra_number(matra_text)
                    if previous_matra is None or (number == previous_matra + 1):
                        f.write(f"#### {matra_text}\n\n")
                        previous_matra = number
                        after = line[len(matra_text):].strip()
                        if after:
                            f.write(after + "\n\n")
                        i += 1
                        continue

                # ✅ มาตราหลักร้อย
                partial = extract_matra_at_line_start(line)
                if partial:
                    number = extract_matra_number(partial)
                    if previous_matra is None or (number == previous_matra + 1):
                        f.write(f"#### {partial}\n\n")
                        previous_matra = number
                        after = line[len(partial):].strip()
                        if after:
                            f.write(after + "\n\n")
                        i += 1
                        continue

                # ✅ หัวเรื่องอื่นๆ
                if any(line.startswith(h) for h in ["บทเฉพาะกาล", "บทนิยาม", "บทกำหนดโทษ"]):
                    f.write(f"## {line}\n\n")
                    i += 1
                    continue

                # ✅ เนื้อหาทั่วไป
                f.write(line + "\n\n")
                i += 1

    clean_markdown_file(md_path)

    return md_path