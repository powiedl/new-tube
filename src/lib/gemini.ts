import { GoogleGenerativeAI } from '@google/generative-ai';
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY!);

export const GEMINI_PREFERED_MODEL = 'gemini-2.0-flash-lite-preview-02-05';
export const GEMINI_BACKUP_MODEL = 'gemini-1.5-flash';
