import shutil
import hashlib
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile
from fastapi import HTTPException
from langchain_community.document_loaders import PyMuPDFLoader

UPLOAD_DIR = Path("external_data")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def get_file_info(file: UploadFile, file_path: Path):
    file.file.seek(0)
    file_hash = hashlib.md5(file.file.read()).hexdigest()
    file.file.seek(0)

    timestamp = datetime.utcnow().isoformat()
    filesize = file_path.stat().st_size  # ✅ ใช้ os path stat หลัง save

    return file_hash, timestamp, filesize

def get_file_hash(file: UploadFile) -> str:
    hasher = hashlib.md5()
    content = file.file.read()
    hasher.update(content)
    file.file.seek(0)  # Reset file pointer after read
    return hasher.hexdigest()

def upload_documents(file: UploadFile):
    # ตรวจสอบว่าเป็นไฟล์ PDF หรือไม่
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="ไฟล์ต้องเป็น PDF เท่านั้น")
    
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ✅ คำนวณหลังจากเขียนไฟล์ลงดิสก์
    file_hash, timestamp, filesize = get_file_info(file, file_path)

    loader = PyMuPDFLoader(str(file_path))
    documents = loader.load()

    for doc in documents:
        doc.metadata.update({
            "source": str(file_path),
            "file_hash": file_hash,
            "timestamp": timestamp,
            "filesize": filesize
        })

    return file_path

