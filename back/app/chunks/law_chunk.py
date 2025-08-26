import os
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode
from langchain.text_splitter import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Distance, VectorParams, SparseVectorParams
from app.documents.file_markdown import read_markdown_file, clean_markdown_and_thai_digits_all

from langchain_core.documents import Document

QDRANT_HOST = os.getenv("QDRANT_HOST", "http://qdrant:6333")

def split_and_index_with_tracking(documents: list[Document], size: int, overlap: int):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=size, chunk_overlap=overlap)
    all_chunks = []

    for i, doc in enumerate(documents):
        splits = text_splitter.split_text(doc.page_content)

        for j, chunk in enumerate(splits):
            all_chunks.append(Document(
                page_content=chunk,
                metadata={
                    **doc.metadata,
                    "parent_id": f"doc-{i}",
                    "chunk_id": j,
                    "chunk_total": len(splits)
                }
            ))

    return all_chunks

def add_to_vector_db(md_path: str, collection_name: str = "default", doc_type: str = "unknown"):

    # ✅ 1. Markdown Split ตามหัวข้อ
    if (doc_type == "law"):
        headers_to_split_on = [("#", "title"), ("##", "chapter"), ("###", "section"), ("####", "article")]
    # unknown
    else :
        headers_to_split_on = [
            ("#", "document"),      # เช่น "สิทธิประโยชน์"
            ("##", "category"),     # เช่น "สวัสดิการ"
            ("###", "item"),        # เช่น "เงินเดือน"
            ("####", "detail")      # บางเอกสารอาจมี เช่น เงื่อนไขเฉพาะ
        ]

    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on, strip_headers=False)
    markdown_read = read_markdown_file(md_path)
    md_split_text = markdown_splitter.split_text(markdown_read)
    md_documents = clean_markdown_and_thai_digits_all(md_split_text)

    # ✅ 2. Split ย่อยตามขนาด
    docs = split_and_index_with_tracking(md_documents, 512, 10)

    # ✅ 3. Embedding (ใช้ Ollama)
    embeddings = OllamaEmbeddings(model="bge-m3:latest")
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

    # ✅ 4. เตรียม Qdrant Hybrid DB
    client = QdrantClient(url=QDRANT_HOST)
    # collection_name = "thai_law_hybrid"

    # 🔄 ลบ collection เดิม (ถ้ามี)
    existing_collections = [c.name for c in client.get_collections().collections]
    if collection_name in existing_collections:
        print(f"⚠️ ลบ collection เดิม: '{collection_name}'...")
        client.delete_collection(collection_name=collection_name)

    # ✅ สร้าง collection ใหม่
    client.create_collection(
        collection_name=collection_name,
        vectors_config={"dense": VectorParams(size=1024, distance=Distance.COSINE)},
        sparse_vectors_config={
            "sparse": SparseVectorParams(index=models.SparseIndexParams(on_disk=False))
        },
    )

    print(f"✅ สร้าง collection ใหม่: '{collection_name}'")

    # ✅ 5. ส่งเข้าฐาน Hybrid Vector Search
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
        sparse_embedding=sparse_embeddings,
        retrieval_mode=RetrievalMode.HYBRID,
        vector_name="dense",
        sparse_vector_name="sparse",
    )

    vectorstore.add_documents(documents=docs)

    print("✅ Done: Indexed into Qdrant!")
