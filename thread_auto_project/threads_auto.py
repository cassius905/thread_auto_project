import requests
import os
import time
import requests

# 1. 설정 정보 입력
THREADS_USER_ID = os.environ.get('threads_user_id', '3306')
ACCESS_TOKEN = os.environ.get('threads_api_key', '3306')
BASE_URL = "https://graph.threads.net/v1.0"

def create_threads_post():
    # ----------------------------------------------------
    # [1단계] Threads 미디어 컨테이너 만들기
    # ----------------------------------------------------
    container_url = f"{BASE_URL}/{THREADS_USER_ID}/threads"
    
    # 생성할 게시글 데이터 설정 (예: 이미지 + 텍스트)
    container_data = {
        "media_type": "TEXT",
        # "image_url": "https://example.com/your-image.jpg",  # 공용 서버에 호스팅된 이미지 URL
        "text": "안녕하세요! 테스트 입니다 #Threads",
        "access_token": ACCESS_TOKEN
    }
    
    print("1단계: 미디어 컨테이너 생성을 요청 중입니다...")
    response = requests.post(container_url, data=container_data)
    res_json = response.json()
    
    if "id" not in res_json:
        print("컨테이너 생성 실패:", res_json)
        return
        
    container_id = res_json["id"]
    print(f"컨테이너 생성 성공! ID: {container_id}")
    
    # 문서 권장사항: 서버가 업로드를 완전히 처리할 수 있도록 평균 30초 대기
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
    else:
        print("게시글 발행 실패:", publish_json)

if __name__ == "__main__":
    create_threads_post()
