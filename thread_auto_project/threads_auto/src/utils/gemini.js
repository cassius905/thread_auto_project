import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize the API with the key from env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const generateThreadsContent = async (topic, count = 1) => {
  if (!genAI) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 프로젝트 루트의 .env 파일에 VITE_GEMINI_API_KEY를 입력하고 서버를 재시작해 주세요.');
  }

  // Use gemini-2.5-flash as it's fast and suitable for this task
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        description: "List of generated thread contents",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            content: {
              type: SchemaType.STRING,
              description: "The generated thread text (max 500 characters)"
            }
          },
          required: ["content"]
        }
      }
    }
  });

  const prompt = `
  You are an expert social media marketer specializing in the Threads platform.
  Write highly engaging, click-inducing posts about the following topic: "${topic}"
  Generate exactly ${count} distinct post(s).
  Each post must be under 500 characters and use a conversational, slightly witty tone.
  Include relevant emojis but no hashtags (Threads doesn't rely heavily on hashtags).
  Format the output as a JSON array of objects, where each object has a "content" string field.
  IMPORTANT: Make sure to use line breaks (\\n) appropriately to separate ideas and make the post highly readable on mobile screens. Do not output a single wall of text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // The response is guaranteed to be JSON matching the schema
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};
