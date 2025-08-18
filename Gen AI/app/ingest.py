import os, re, math
from pathlib import Path
from typing import Iterable
from PyPDF2 import PdfReader
from docx import Document as Docx
from sqlalchemy import text
from db import SessionLocal
from models import Base
from embedding import embed_passages
from config import settings

ROOT = Path("/data")

def read_txt(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")

def read_pdf(p: Path) -> str:
    reader = PdfReader(str(p))
    return "\n".join(page.extract_text() or "" for page in reader.pages)

def read_docx(p: Path) -> str:
    d = Docx(str(p))
    return "\n".join(p.text for p in d.paragraphs)

READERS = {
    ".txt": read_txt,
    ".md": read_txt,
    ".pdf": read_pdf,
    ".docx": read_docx,
}

def clean_text(s: str) -> str:
    s = re.sub(r"\s+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def chunk_text(s: str, size: int, overlap: int) -> list[str]:
    # simple char-based splitter to stay offline and lightweight
    if not s:
        return []
    chunks = []
    i = 0
    while i < len(s):
        chunks.append(s[i : i + size])
        i += (size - overlap)
    return chunks

def iter_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in READERS:
            yield p

def main():
    Base.metadata.create_all(bind=SessionLocal().bind)  # tables exist already via init.sql; safe
    with SessionLocal() as s:
        # ensure extension (idempotent)
        from db import ensure_pgvector
        ensure_pgvector(s)

        for path in iter_files(ROOT):
            rel = str(path.relative_to(ROOT))
            # Insert or get doc id
            doc = s.execute(text("insert into documents(path, title) values (:p, :t) on conflict(path) do update set title=excluded.title returning id"),
                            {"p": rel, "t": path.stem}).scalar_one()
            # Remove old chunks for this doc (simple re-index)
            s.execute(text("delete from chunks where document_id = :id"), {"id": doc})
            s.commit()

            raw = READERS[path.suffix.lower()](path)
            raw = clean_text(raw)
            pieces = chunk_text(raw, settings.chunk_size, settings.chunk_overlap)
            if not pieces:
                continue
            # Embed
            embs = embed_passages(pieces)  # shape (n, 768)
            # Bulk insert
            values = []
            for i, (content, emb) in enumerate(zip(pieces, embs)):
                values.append({
                    "document_id": doc,
                    "chunk_index": i,
                    "content": content,
                    "embedding": emb.tolist()
                })
            # Use JSON array -> vector cast per row
            s.execute(text("""
                insert into chunks(document_id, chunk_index, content, embedding)
                select
                  v->>'document_id'::bigint,
                  v->>'chunk_index'::int,
                  v->>'content',
                  (SELECT vector_avg(ARRAY[
                      -- Build vector from JSON numeric array
                      -- Workaround: sum into vector by unnest; but easier: use pgvector python binding normally.
                      -- Simpler approach: pass as string '(...)' in Python:
                      -- We'll compose in Python instead; see below.
                  ]))
                from json_array_elements(:vals::json) as v
            """), {"vals": "[]"})
            # The above is cumbersome; instead do per-row insert with parameterized vector literal:
            s.rollback()
            for row in values:
                vec = "(" + ",".join(f"{x:.6f}" for x in row["embedding"]) + ")"
                s.execute(
                    text("insert into chunks(document_id, chunk_index, content, embedding) values (:d, :i, :c, :e::vector)"),
                    {"d": row["document_id"], "i": row["chunk_index"], "c": row["content"], "e": vec}
                )
            s.commit()
    print("Ingestion complete.")

if __name__ == "__main__":
    main()
