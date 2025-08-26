from collections import OrderedDict
from typing import Dict, List, Tuple
from langchain_ollama import OllamaEmbeddings
from qdrant_client import QdrantClient, models
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode

import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
QDRANT_HOST = os.getenv("QDRANT_HOST", "http://qdrant:6333")

class VectorDBManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_resources()
        return cls._instance
    
    def _init_resources(self):
        """Initialize all resources once"""
        self.client = QdrantClient(url=QDRANT_HOST)
        self.vector_stores: Dict[str, QdrantVectorStore] = {}
        self._dense_embeddings = None
        self._sparse_embeddings = None
    
    @property
    def dense_embeddings(self) -> OllamaEmbeddings:
        """Lazy initialization of dense embeddings"""
        if self._dense_embeddings is None:
            self._dense_embeddings = OllamaEmbeddings(
                model="bge-m3:latest",
                base_url=OLLAMA_HOST
            )
        return self._dense_embeddings
    
    @property
    def sparse_embeddings(self) -> FastEmbedSparse:
        """Lazy initialization of sparse embeddings"""
        if self._sparse_embeddings is None:
            self._sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")
        return self._sparse_embeddings
    
    def get_embedding(self, embedding_type: str = "dense"):
        """
        Get embedding function by type
        Args:
            embedding_type: "dense" or "sparse"
        """
        if embedding_type == "dense":
            return self.dense_embeddings
        elif embedding_type == "sparse":
            return self.sparse_embeddings
        else:
            raise ValueError(f"Unknown embedding type: {embedding_type}")
    
    def get_vectorstore(self, collection_name: str) -> QdrantVectorStore:
        """Get or create vector store for a collection"""
        if collection_name not in self.vector_stores:
            self.vector_stores[collection_name] = QdrantVectorStore(
                client=self.client,
                collection_name=collection_name,
                embedding=self.dense_embeddings,
                sparse_embedding=self.sparse_embeddings,
                retrieval_mode=RetrievalMode.HYBRID,
                vector_name="dense",
                sparse_vector_name="sparse",
            )
        return self.vector_stores[collection_name]
    
# Singleton instance
db_manager = VectorDBManager()

# Helper functions from your original code
def get_unique_parent_id_with_score(results: List[Tuple], limit: int = 10) -> OrderedDict:
    """Get unique documents by parent_id with highest scores"""
    unique_docs = OrderedDict()
    for doc, score in results:
        parent_id = doc.metadata.get("parent_id")
        if parent_id is None:
            continue
        if parent_id not in unique_docs:
            unique_docs[parent_id] = []
        unique_docs[parent_id].append((doc, score))
        if len(unique_docs) == limit:
            break
    
    # Sort by highest score and take top 'limit' unique documents
    sorted_unique = OrderedDict(
        sorted(unique_docs.items(), 
               key=lambda x: max(s[1] for s in x[1]), 
               reverse=True)[:limit]
    )
    return sorted_unique
    # return unique_docs

def get_chunk_id(point):
    try:
        return point.payload["metadata"]["chunk_id"]
    except (KeyError, TypeError):
        return float("inf")  # ดันอันที่ไม่มี chunk_id ไปท้าย

def sort_chunk_by_id(points):
    return sorted(points, key=get_chunk_id)

def merge_chunk(sorted_points) -> str:
    """
    รวมข้อความทั้งหมดจาก field 'page_content' ของแต่ละ point
    """
    merged_texts = []

    for point in sorted_points:
        try:
            page_content = point.payload["page_content"]
            merged_texts.append(page_content)
        except (KeyError, TypeError) as e:
            print(f"❗ ข้าม point เพราะ error: {e}, payload: {point.payload}")

    return "\n".join(merged_texts)  # เว้นบรรทัดระหว่าง chunk

def search_chunk_by_parent_id(collection_name: str, parent_id: str, limit: int = 20) -> str:
    try:
        vectorstore = db_manager.get_vectorstore(collection_name)
        # ดึงทุก chunk ที่มี parent_id เดียวกัน
        results = vectorstore.client.scroll(
            collection_name=collection_name,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.parent_id",  # ใช้ key ตาม schema ที่ index ไว้
                        match=models.MatchValue(value=parent_id),
                    ),
                ]
            ),
            limit=limit
        )

        # เรียงตาม chunk_id และรวม
        sorted_points = sort_chunk_by_id(results[0])
        merged_text = merge_chunk(sorted_points)
        
        return merged_text
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการ scroll: {e}")
        return ([], None)