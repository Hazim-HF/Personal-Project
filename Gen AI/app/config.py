from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_host: str = Field(..., alias="DB_HOST")
    db_port: int = Field(5432, alias="DB_PORT")
    db_name: str = Field(..., alias="DB_NAME")
    db_user: str = Field(..., alias="DB_USER")
    db_pass: str = Field(..., alias="DB_PASS")

    llm_base_url: str = Field(..., alias="LLM_BASE_URL")
    llm_model_name: str = Field("main", alias="LLM_MODEL_NAME")
    llm_api_key: str = Field("dummy", alias="LLM_API_KEY")

    embeddings_path: str = Field(..., alias="EMBEDDINGS_LOCAL_PATH")

    app_host: str = Field("0.0.0.0", alias="APP_HOST")
    app_port: int = Field(7000, alias="APP_PORT")
    top_k: int = Field(6, alias="TOP_K")
    chunk_size: int = Field(1200, alias="CHUNK_SIZE")
    chunk_overlap: int = Field(200, alias="CHUNK_OVERLAP")
    max_context_chars: int = Field(14000, alias="MAX_CONTEXT_CHARS")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
