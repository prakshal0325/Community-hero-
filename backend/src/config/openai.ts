import OpenAI from 'openai';
import env from './env.js';

let openai: OpenAI | null = null;

if (env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

export const getOpenAIClient = (): OpenAI | null => openai;

export const isAIAvailable = (): boolean => !!openai;

export const AI_MODEL = env.OPENAI_MODEL;

export default openai;
