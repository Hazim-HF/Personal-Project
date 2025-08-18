create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  path text not null unique,
  title text,
  created_at timestamptz default now()
);

-- Using bge-base/bge-large (768 dims). Adjust if your emb dim differs.
create table if not exists chunks (
  id bigserial primary key,
  document_id bigint not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz default now()
);

-- Cosine distance index for fast ANN search
create index if not exists idx_chunks_embedding
  on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists idx_chunks_doc on chunks(document_id, chunk_index);
