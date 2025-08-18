import os
import numpy as np
from sentence_transformers import SentenceTransformer

from config import settings

# Load local model (no internet)
_model = SentenceTransformer(settings.embeddings_path, device="cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu")

def embed_texts(texts: list[str]) -> np.ndarray:
    # bge models recommend "query: " prefix for queries; "passage: " for docs
    embs = _model.encode(texts, normalize_embeddings=True, batch_size=32, convert_to_numpy=True, show_progress_bar=False)
    return embs.astype(np.float32)

def embed_query(q: str) -> np.ndarray:
    return embed_texts([f"query: {q}"])[0]

def embed_passages(ps: list[str]) -> np.ndarray:
    return embed_texts([f"passage: {p}" for p in ps])
