import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PostGenerationRequest {
  prompt: string;
  tone: 'professional' | 'casual' | 'inspirational' | 'educational';
  length: 'short' | 'medium' | 'long';
  hashtags?: string;
}

export interface PostGenerationResponse {
  content: string;
  suggestedHashtags?: string[];
}

export async function generateLinkedInPost(request: PostGenerationRequest): Promise<PostGenerationResponse> {
  try {
    const { prompt, tone, length, hashtags } = request;
    
    // Construct the system prompt based on parameters
    let systemPrompt = `You are a professional LinkedIn content writer. Generate a ${tone} LinkedIn post based on the user's prompt. `;
    
    switch (length) {
      case 'short':
        systemPrompt += 'Keep it concise and engaging, around 100-150 words. ';
        break;
      case 'medium':
        systemPrompt += 'Write a medium-length post, around 200-300 words. ';
        break;
      case 'long':
        systemPrompt += 'Create a comprehensive post, around 400-500 words. ';
        break;
    }
    
    systemPrompt += `Make it engaging and professional. Use appropriate emojis sparingly if they fit the tone. `;
    
    if (hashtags) {
      systemPrompt += `Include these hashtags: ${hashtags}. `;
    } else {
      systemPrompt += `Suggest 3-5 relevant hashtags at the end. `;
    }
    
    systemPrompt += `Respond with JSON in this exact format: {"content": "your post content", "suggestedHashtags": ["hashtag1", "hashtag2"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
            suggestedHashtags: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["content"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data: PostGenerationResponse = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    console.error("Error generating LinkedIn post:", error);
    throw new Error(`Failed to generate post: ${error}`);
  }
}

export async function enhancePost(content: string): Promise<string> {
  try {
    const systemPrompt = `You are a LinkedIn content optimization expert. Enhance the given post to make it more engaging while maintaining its core message. Improve formatting, add relevant emojis if appropriate, and ensure it follows LinkedIn best practices.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: `Enhance this LinkedIn post: ${content}`,
    });

    return response.text || content;
  } catch (error) {
    console.error("Error enhancing post:", error);
    return content; // Return original content if enhancement fails
  }
}
