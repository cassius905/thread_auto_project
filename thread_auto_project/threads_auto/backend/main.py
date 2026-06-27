from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
import traceback
import asyncio
import os
from pydantic import BaseModel

from .database import engine, get_db, SessionLocal
from . import models, schemas
from .threads_api import publish_to_threads

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()
main_loop = None

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or authorization.replace("Bearer ", "") != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    return authorization

class LoginRequest(BaseModel):
    password: str

class BulkRequest(BaseModel):
    post_ids: List[int]

class BulkScheduleRequest(BaseModel):
    post_ids: List[int]
    scheduled_at: datetime

# Create database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Anti-gravity API")

scheduler = BackgroundScheduler()

def check_and_publish_scheduled_posts():
    db = SessionLocal()
    try:
        now = datetime.now()
        # Find all scheduled posts whose time has passed
        posts_to_publish = db.query(models.Post).filter(
            models.Post.status == 'SCHEDULED',
            models.Post.scheduled_at <= now
        ).all()
        
        for post in posts_to_publish:
            print(f"[{now}] Processing scheduled post ID {post.id}...")
            try:
                media_id = publish_to_threads(post.content)
                post.status = 'COMPLETED'
                post.sent_at = now
                post.thread_url = f"https://www.threads.net/t/{media_id}" # Store media ID or URL
                db.commit()
                print(f"Successfully published post ID {post.id}")
                if main_loop:
                    asyncio.run_coroutine_threadsafe(manager.broadcast({"action": "refresh"}), main_loop)
            except Exception as e:
                print(f"Error publishing post ID {post.id}: {e}")
                traceback.print_exc()
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    global main_loop
    try:
        main_loop = asyncio.get_running_loop()
    except Exception:
        pass
    scheduler.add_job(check_and_publish_scheduled_posts, 'interval', seconds=60)
    scheduler.start()
    print("Background scheduler started.")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("Background scheduler stopped.")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to ["http://localhost:5173"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/login")
def login(request: LoginRequest):
    if request.password == ADMIN_PASSWORD:
        return {"success": True, "token": ADMIN_PASSWORD}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/posts", response_model=List[schemas.PostResponse])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).all()
    return posts

@app.post("/api/posts", response_model=List[schemas.PostResponse])
def create_posts(posts: List[schemas.PostCreate], background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_posts = []
    for post in posts:
        db_post = models.Post(**post.dict())
        db.add(db_post)
        db_posts.append(db_post)
    
    db.commit()
    
    # Refresh to get IDs
    for db_post in db_posts:
        db.refresh(db_post)
        
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return db_posts

@app.put("/api/posts/{post_id}/status", response_model=schemas.PostResponse)
def update_post_status(post_id: int, status_update: schemas.PostUpdateStatus, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_post.status = status_update.status
    
    update_data = status_update.dict(exclude_unset=True)
    if 'scheduled_at' in update_data:
        db_post.scheduled_at = update_data['scheduled_at']
    if 'sent_at' in update_data:
        db_post.sent_at = update_data['sent_at']
        
    db.commit()
    db.refresh(db_post)
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return db_post

@app.put("/api/posts/{post_id}", response_model=schemas.PostResponse)
def update_post_content(post_id: int, content_update: schemas.PostUpdateContent, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_post.content = content_update.content
    db.commit()
    db.refresh(db_post)
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return db_post

@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(db_post)
    db.commit()
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return {"message": "Post deleted successfully"}

@app.put("/api/posts/bulk/approve")
def bulk_approve(request: BulkRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_posts = db.query(models.Post).filter(models.Post.id.in_(request.post_ids)).all()
    for post in db_posts:
        if post.status == 'CREATED':
            post.status = "APPROVED"
    db.commit()
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return {"message": f"Bulk approved {len(request.post_ids)} posts"}

@app.delete("/api/posts/bulk/delete")
def bulk_delete(request: BulkRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db.query(models.Post).filter(models.Post.id.in_(request.post_ids)).delete(synchronize_session=False)
    db.commit()
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return {"message": f"Bulk deleted {len(request.post_ids)} posts"}

@app.put("/api/posts/bulk/schedule")
def bulk_schedule(request: BulkScheduleRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_posts = db.query(models.Post).filter(models.Post.id.in_(request.post_ids)).all()
    for post in db_posts:
        if post.status in ['APPROVED', 'SCHEDULED']:
            post.status = "SCHEDULED"
            post.scheduled_at = request.scheduled_at
    db.commit()
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return {"message": f"Bulk scheduled {len(request.post_ids)} posts"}

@app.put("/api/posts/bulk/cancel-schedule")
def bulk_cancel_schedule(request: BulkRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_posts = db.query(models.Post).filter(models.Post.id.in_(request.post_ids)).all()
    for post in db_posts:
        if post.status == 'SCHEDULED':
            post.status = "APPROVED"
            post.scheduled_at = None
    db.commit()
    background_tasks.add_task(manager.broadcast, {"action": "refresh"})
    return {"message": f"Bulk cancel schedule {len(request.post_ids)} posts"}

@app.get("/api/settings/{key}", response_model=schemas.SettingResponse)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if not setting:
        return {"key": key, "value": ""}
    return setting

@app.put("/api/settings/{key}")
def update_setting(key: str, request: schemas.SettingBase, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if setting:
        setting.value = request.value
    else:
        setting = models.Setting(key=key, value=request.value)
        db.add(setting)
    db.commit()
    return {"message": "Setting updated"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
