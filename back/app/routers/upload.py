from fastapi.responses import JSONResponse
from fastapi import APIRouter, UploadFile, File
from app.chunks.law_chunk import add_to_vector_db
from app.documents.file_upload import upload_documents
from app.documents.markdown_type import route_markdown_transform

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    # collection_name: str = Form(...),
):
    try:
        file_path = upload_documents(file)
        md_path, doc_type = route_markdown_transform(file_path)
        if (doc_type == "law"):
            collection_name = "thai_law_hybrid"
        else:
            collection_name = "default"

        add_to_vector_db(md_path, collection_name, doc_type)
    except ValueError as ve:
        return JSONResponse(status_code=400, content={"error": str(ve)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error: {str(e)}"})

    return {
        "filename": file.filename,
        "file_path": str(file_path),
        "md_path": str(md_path),
        # "preview": preview,
        # "chunks_added": len(chunks),
        # "saved_markdown": md_path
    }