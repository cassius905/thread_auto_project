

from google import genai

with open('prompt.txt', 'r', encoding='utf-8') as file:
    ai_prompt = file.read()

client = genai.Client(api_key="")
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents= ai_prompt,
)

ai_response = response.text


