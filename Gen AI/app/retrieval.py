from typing import List, Tuple
from sqlalchemy import text
from db import SessionLocal
from embedding import embed_query
from config import settings

def search(query: str, k: int | None = None) -> List[Tuple[str, str, int]]:
    """Returns list of (content, title, chunk_index)."""
    k = k or settings.top_k
    q_emb = embed_query(query)
    vec = "(" + ",".join(f"{x:.6f}" for x in q_emb) + ")"

    sql = text(f"""
      select c.content, d.title, c.chunk_index
      from chunks c
      join documents d on d.id = c.document_id
      order by c.embedding <=> :qemb::vector
      limit :k
    """)
    with SessionLocal() as s:
        rows = s.execute(sql, {"qemb": vec, "k": k}).all()
    return [(r[0], r[1], r[2]) for r in rows]
