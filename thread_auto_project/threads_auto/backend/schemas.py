from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PostBase(BaseModel):
    content: str
    media_urls: Optional[List[str]] = []
    status: Optional[str] = 'CREATED'
    thread_url: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdateStatus(BaseModel):
    status: str
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None

class PostUpdateContent(BaseModel):
    content: str

class PostResponse(PostBase):
    id: int
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SettingBase(BaseModel):
    value: str

class SettingResponse(SettingBase):
    key: str

    class Config:
        from_attributes = True
