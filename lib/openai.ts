import OpenAI from 'openai';
import { APIError } from 'openai/error';

let openaiInstance: OpenAI | null = null;

export const initializeOpenAI = async (apiKey: string) => {
  try {
    // Create a new instance
    const tempInstance = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    
    // Test the API key with a simple models list request
    await tempInstance.models.list();
    
    // If successful, set the instance
    openaiInstance = tempInstance;
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case 401:
          throw new Error('Invalid API key');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        default:
          throw new Error('Failed to validate API key');
      }
    }
    throw new Error('Failed to validate API key');
  }
};

export const getOpenAIInstance = () => {
  if (!openaiInstance) {
    throw new Error('OpenAI not initialized');
  }
  return openaiInstance;
};

export const summarizeText = async (
  text: string,
  length: 'short' | 'medium' | 'detailed',
  format: string = 'paragraphs',
  language?: string
) => {
  const openai = getOpenAIInstance();
  
  const lengthPrompts = {
    short: 'Summarize this text in 2-3 sentences',
    medium: 'Provide a medium-length summary in 4-5 sentences',
    detailed: 'Create a detailed summary while keeping it concise'
  };

  const formatPrompt = format === 'bullets' 
    ? 'Format the summary as bullet points, with each main point on a new line starting with "• "'
    : 'Format the summary as coherent paragraphs';

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a text summarizer. ${lengthPrompts[length]}. ${formatPrompt}. ${
            language ? `Respond in ${language}.` : ''
          }`
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case 401:
          throw new Error('Invalid API key');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('OpenAI service error. Please try again later.');
        default:
          throw new Error('Failed to generate summary');
      }
    }
    throw new Error('Failed to generate summary');
  }
};