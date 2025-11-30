import { GoogleGenerativeAI } from '@google/generative-ai';
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY!);

export const GEMINI_PREFERED_MODEL =
  process.env.GEMINI_PREFERED_MODEL || 'gemini-2.5-flash-preview-09-2025';
export const GEMINI_BACKUP_MODEL =
  process.env.GEMINI_BACKUP_MODEL || 'gemini-2.5-flash';
