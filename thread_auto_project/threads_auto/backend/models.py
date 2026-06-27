from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, JSON, func
from .database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, nullable=True)
    status = Column(Enum('CREATED', 'APPROVED', 'SCHEDULED', 'COMPLETED'), default='CREATED')
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    thread_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
