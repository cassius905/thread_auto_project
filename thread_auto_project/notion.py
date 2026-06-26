import requests
import json
from datetime import datetime
from google import genai

# 1. 고유 키 및 설정값 입력
NOTION_TOKEN = "YOUR_NOTION_API_TOKEN"      # 노션에서 발급받은 시크릿 토큰
DATABASE_ID = "YOUR_NOTION_DATABASE_ID"    # 노션 데이터베이스 ID
OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"    # OpenAI API 키 (필요 시)

with open('prompt.txt', 'r', encoding='utf-8') as file:
    ai_prompt = file.read()

# 2. AI 콘텐츠 생성 함수 (예시: OpenAI GPT 사용)
def generate_ai_content(prompt):
    print("AI 콘텐츠 생성 중...")

    client = genai.Client(api_key="")
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents= ai_prompt,
    )
    ai_response = response.text
    return ai_response

# 3. 노션 데이터베이스에 저장하는 함수
def insert_to_notion(title, content):
    url = "https://api.notion.com/v1/pages"
    
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28" # 최신 노션 API 버전
    }
    
    # 노션 데이터베이스 스키마에 맞춘 데이터 구조(Payload)
    data = {
        "parent": { "database_id": DATABASE_ID },
        "properties": {
            "이름": {
                "title": [
                    {
                        "text": { "content": title }
                    }
                ]
            },
            "AI 생성 내용": {
                "rich_text": [
                    {
                        "text": { "content": content }
                    }
                ]
            },
            "생성일": {
                "date": { "start": datetime.now().isoformat() }
            }
        }
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        print("🎉 노션 데이터베이스에 성공적으로 기록되었습니다!")
    else:
        print(f"❌ 에러 발생: {response.status_code}")
        print(response.text)

# 4. 실행부
if __name__ == "__main__":
    keyword = "인공지능 트렌드 2026"
    user_prompt = f"'{keyword}'에 대한 짧은 요약 글을 작성해줘."
    
    # AI 내용 생성
    ai_result = generate_ai_content(user_prompt)
    print(f"\n[AI 생성 내용]\n{ai_result}\n")
    
    # 노션에 저장
    insert_to_notion(title=keyword, content=ai_result)