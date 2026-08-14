from pydantic import BaseModel, HttpUrl

class ScanRequest(BaseModel):
    repo_url: str

class ScanResponse(BaseModel):
    status: str
    message: str
    task_id: str | None = None
