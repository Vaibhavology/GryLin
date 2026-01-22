/**
 * OCR Library using Google ML Kit Text Recognition
 * Simple approach: Extract ALL text and let AI analyze it
 */

import TextRecognition, { TextRecognitionResult, TextBlock } from '@react-native-ml-kit/text-recognition';

// Simple OCR Result - just the raw text
export interface OCRResult {
  fullText: string;
  blocks: TextBlock[];
  lines: string[];
  confidence: number;
}

/**
 * Extract text from an image using Google ML Kit
 * Returns ALL text without any pre-processing - let AI handle analysis
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  console.log('[OCR] ========================================');
  console.log('[OCR] Starting ML Kit text recognition...');
  console.log('[OCR] Image URI:', imageUri);
  
  try {
    const result: TextRecognitionResult = await TextRecognition.recognize(imageUri);
    
    // Extract all lines of text
    const lines: string[] = [];
    for (const block of result.blocks) {
      for (const line of block.lines) {
        const text = line.text.trim();
        if (text) {
          lines.push(text);
        }
      }
    }
    
    // Build full text - preserve line breaks for context
    const fullText = lines.join('\n');
    
    console.log('[OCR] ========== COMPLETE OCR TEXT ==========');
    console.log(fullText);
    console.log('[OCR] =========================================');
    console.log('[OCR] Total lines:', lines.length);
    console.log('[OCR] Total characters:', fullText.length);
    
    return {
      fullText,
      blocks: result.blocks,
      lines,
      confidence: 0.95,
    };
  } catch (error: any) {
    console.error('[OCR] Text recognition failed:', error?.message || error);
    throw new Error(`OCR failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Convert DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
 */
export function convertDateFormat(dateStr: string): string | null {
  const ddmmyyyy = dateStr.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }
  
  const ddmmyy = dateStr.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2})$/);
  if (ddmmyy) {
    const [, day, month, yy] = ddmmyy;
    const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
    return `${year}-${month}-${day}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  return null;
}

export default {
  extractTextFromImage,
  convertDateFormat,
};
