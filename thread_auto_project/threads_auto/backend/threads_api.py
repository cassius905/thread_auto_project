import requests
import os
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

THREADS_USER_ID = os.environ.get('THREADS_USER_ID', '')
ACCESS_TOKEN = os.environ.get('THREADS_API_KEY', '')
BASE_URL = "https://graph.threads.net/v1.0"

def publish_to_threads(content: str) -> str:
    """
    Publishes the content to Threads and returns the media ID if successful.
    Raises an exception if it fails.
    """
    if not THREADS_USER_ID or not ACCESS_TOKEN:
        raise ValueError("THREADS_USER_ID or THREADS_API_KEY is not set in environment variables.")

    # ----------------------------------------------------
    # [1단계] Threads 미디어 컨테이너 만들기
    # ----------------------------------------------------
    container_url = f"{BASE_URL}/{THREADS_USER_ID}/threads"
    
    container_data = {
        "media_type": "TEXT",
        "text": content,
        "access_token": ACCESS_TOKEN
    }
    
    print("1단계: 미디어 컨테이너 생성을 요청 중입니다...")
    response = requests.post(container_url, data=container_data)
    res_json = response.json()
    
    if "id" not in res_json:
        print("컨테이너 생성 실패:", res_json)
        raise Exception(f"Failed to create media container: {res_json}")
        
    container_id = res_json["id"]
    print(f"컨테이너 생성 성공! ID: {container_id}")
    
    # 서버가 업로드를 완전히 처리할 수 있도록 30초 대기
    print("미디어 처리를 위해 30초 동안 대기합니다...")
    time.sleep(30)
    
    # ----------------------------------------------------
    # [2단계] Threads 미디어 컨테이너 게시하기
    # ----------------------------------------------------
    publish_url = f"{BASE_URL}/{THREADS_USER_ID}/threads_publish"
    
    publish_data = {
        "creation_id": container_id,
        "access_token": ACCESS_TOKEN
    }
    
    print("2단계: 게시글 발행을 요청 중입니다...")
    publish_response = requests.post(publish_url, data=publish_data)
    publish_json = publish_response.json()
    
    if "id" in publish_json:
        print(f"게시글이 성공적으로 등록되었습니다! 미디어 ID: {publish_json['id']}")
        return publish_json['id']
    else:
        print("게시글 발행 실패:", publish_json)
        raise Exception(f"Failed to publish container: {publish_json}")
