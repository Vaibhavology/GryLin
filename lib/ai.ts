import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '@env';
import { DocumentAnalysis, ItemCategory } from '../types';
import { EmailContent } from './gmail';

// Email Analysis Types
export interface EmailAnalysis {
  vendor_name: string;
  action_type: string;
  due_date: string | null;
  amount: number | null;
  category: ItemCategory;
  summary_bullets: string[];
  is_transactional: boolean;
}

export interface ScamAnalysis {
  is_scam: boolean;
  risk_score: number;
  scam_indicators: string[];
  recommendation: string;
}

export interface InsightSummary {
  obligation: string;
  deadline: string;
  consequence: string;
}

// Initialize Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// Rate Limiter Implementation
class RateLimiter {
  private queue: Array<{
    request: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minDelayMs = 2000;

  async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        request: request as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const delayNeeded = Math.max(0, this.minDelayMs - timeSinceLastRequest);

      if (delayNeeded > 0) {
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }

      try {
        this.lastRequestTime = Date.now();
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isProcessing = false;
  }
}

const rateLimiter = new RateLimiter();

// Valid categories
const VALID_CATEGORIES: ItemCategory[] = ['Finance', 'Education', 'Shopping', 'Health', 'Career', 'Other'];

// Comprehensive prompt for Indian document analysis
const INDIAN_DOCUMENT_PROMPT = `You are an expert AI specialized in analyzing Indian documents from OCR text.

## DOCUMENT TYPES (identify correctly):

1. **Driving Licence** - Look for: "DRIVING LICENCE", "MOTOR VEHICLE", state transport logo, vehicle classes (LMV, MCWG)
2. **Learner's Licence** - Look for: "LEARNER'S LICENCE", "LLR", "LEARNING LICENCE" (ONLY if explicitly mentioned)
3. **PAN Card** - Look for: "PERMANENT ACCOUNT NUMBER", "INCOME TAX", 10-char code (ABCDE1234F)
4. **Aadhaar Card** - Look for: "AADHAAR", "UIDAI", 12-digit number
5. **Passport** - Look for: "PASSPORT", "REPUBLIC OF INDIA"
6. **Voter ID** - Look for: "ELECTION COMMISSION", "EPIC"
7. **Vehicle RC** - Look for: "REGISTRATION CERTIFICATE", "CHASSIS", "ENGINE"
8. **Electricity Bill** - Look for: "ELECTRICITY", power company, "KWH"
9. **Credit Card** - Look for: "CREDIT CARD", "VALID THRU", "CVV", card number (16 digits), bank name
10. **Credit Card Statement** - Look for: "STATEMENT", "MINIMUM DUE", "TOTAL DUE", "BILLING CYCLE"
11. **Invoice/Receipt** - Look for: "INVOICE", "RECEIPT", "GST"
12. **Medical Document** - Look for: "HOSPITAL", "PRESCRIPTION", "PATIENT"
13. **Educational Document** - Look for: "CERTIFICATE", "MARKSHEET", "UNIVERSITY"

## CRITICAL: DATE IDENTIFICATION

### For Government IDs (DL, PAN, Aadhaar, Passport):
- **DOB**: Labeled "DOB", "Date of Birth" - Usually 1970s-2000s. NOT the due date!
- **Issue Date**: Labeled "DOI", "Date of Issue" - NOT the due date!
- **Validity/Expiry**: Labeled "Valid Till", "Expiry", "DOE" - THIS IS the due date!
- Format: DD-MM-YYYY or DD/MM/YYYY → Convert to YYYY-MM-DD

### For CREDIT CARDS (Physical Card):
- **VALID THRU / VALID FROM**: Format is MM/YY (Month/Year)
- Example: "01/31" means January 2031, "12/28" means December 2028
- Convert MM/YY to YYYY-MM-DD: "01/31" → "2031-01-31" (last day of month)
- The VALID THRU date IS the due_date (card expiry)
- IGNORE any other dates on the card

### For Credit Card STATEMENTS:
- **Due Date**: Labeled "Due Date", "Payment Due", "Pay By"
- **Statement Date**: NOT the due date
- Format: Usually DD-MM-YYYY or DD MMM YYYY

### For Bills (Electricity, Phone, etc.):
- **Due Date**: Labeled "Due Date", "Pay By", "Last Date"
- **Bill Date**: NOT the due date

## CRITICAL: NAME IDENTIFICATION

- **Holder's Name**: The main "Name" field or name embossed on card - USE THIS IN TITLE
- **Father's Name**: Labeled "S/O", "D/O", "Father" - NOT the holder
- For Credit Cards: The name embossed on the card is the holder's name

## OUTPUT FORMAT (JSON only):

{
  "title": "[Document Type] - [Holder's Name]",
  "amount": null or number,
  "due_date": "YYYY-MM-DD" or null,
  "category": "Finance" | "Education" | "Shopping" | "Health" | "Career" | "Other",
  "summary_bullets": ["bullet1", "bullet2", "bullet3"],
  "is_scam": false
}

## CATEGORY MAPPING:
- Government IDs (DL, PAN, Aadhaar, Passport, Voter ID, RC) → "Other"
- Credit Cards, Bills, Banking, Statements → "Finance"
- Medical → "Health"
- Receipts, Shopping → "Shopping"
- Certificates, Education → "Education"
- Employment → "Career"

## DATE FORMAT CONVERSIONS:

1. DD-MM-YYYY → YYYY-MM-DD
   Example: "26-01-2042" → "2042-01-26"

2. MM/YY (Credit Card) → YYYY-MM-DD (last day of month)
   Example: "01/31" → "2031-01-31"
   Example: "12/28" → "2028-12-31"
   Example: "06/25" → "2025-06-30"

3. DD MMM YYYY → YYYY-MM-DD
   Example: "15 Jan 2025" → "2025-01-15"

Respond with ONLY valid JSON.`;

// Validate AI response
function validateDocumentAnalysis(response: unknown): DocumentAnalysis {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid AI response: not an object');
  }

  const data = response as Record<string, unknown>;

  // Validate title
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    throw new Error('Invalid AI response: title must be a non-empty string');
  }

  // Validate amount
  if (data.amount !== null && typeof data.amount !== 'number') {
    data.amount = null;
  }

  // Validate due_date
  let dueDate = data.due_date;
  if (dueDate !== null) {
    if (typeof dueDate !== 'string') {
      dueDate = null;
    } else {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        dueDate = null;
      } else {
        const year = parsedDate.getFullYear();
        if (year < 2000 || year > 2100) {
          dueDate = null;
        }
      }
    }
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(data.category as ItemCategory)) {
    data.category = 'Other';
  }

  // Validate summary_bullets
  let summaryBullets: string[] = [];
  if (Array.isArray(data.summary_bullets)) {
    summaryBullets = data.summary_bullets.filter((item): item is string => typeof item === 'string');
  }
  if (summaryBullets.length === 0) {
    summaryBullets = ['Document scanned successfully'];
  }

  const isScam = typeof data.is_scam === 'boolean' ? data.is_scam : false;

  return {
    title: data.title,
    amount: data.amount as number | null,
    due_date: dueDate as string | null,
    category: data.category as ItemCategory,
    summary_bullets: summaryBullets,
    is_scam: isScam,
  };
}

// AI Service Interface
export interface AIService {
  analyzeDocument(imageUrl: string): Promise<DocumentAnalysis>;
  summarizeText(text: string): Promise<string[]>;
  queueRequest<T>(request: () => Promise<T>): Promise<T>;
}

/**
 * Analyze document text extracted by ML Kit OCR
 * Sends ALL text to Groq AI for comprehensive analysis
 */
export async function analyzeDocumentText(ocrText: string): Promise<DocumentAnalysis> {
  console.log('[AI] ========================================');
  console.log('[AI] Starting AI analysis...');
  console.log('[AI] OCR Text length:', ocrText.length);
  console.log('[AI] ========== OCR TEXT ==========');
  console.log(ocrText);
  console.log('[AI] ================================');
  
  return rateLimiter.queueRequest(async () => {
    const userMessage = `Analyze this Indian document OCR text and extract information:

=== DOCUMENT TEXT ===
${ocrText}
=== END TEXT ===

IMPORTANT REMINDERS:
1. Identify the CORRECT document type from the text
2. Use the HOLDER'S name in title (not father's name from S/O)
3. Use VALIDITY/EXPIRY date as due_date (NOT the DOB!)
4. For CREDIT CARDS: "VALID THRU" format is MM/YY (e.g., "01/31" = January 2031 → "2031-01-31")
5. Convert all dates to YYYY-MM-DD format

Respond with JSON only.`;

    console.log('[AI] Calling Groq llama-3.3-70b-versatile...');
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: INDIAN_DOCUMENT_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    
    console.log('[AI] ========== GROQ RESPONSE ==========');
    console.log(content);
    console.log('[AI] =====================================');
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON
    let parsedResponse: unknown;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResponse = JSON.parse(jsonString.trim());
    } catch (e) {
      console.error('[AI] JSON parse error:', e);
      throw new Error('Failed to parse AI response');
    }

    const result = validateDocumentAnalysis(parsedResponse);
    
    console.log('[AI] ========== FINAL RESULT ==========');
    console.log('[AI] Title:', result.title);
    console.log('[AI] Due Date:', result.due_date);
    console.log('[AI] Category:', result.category);
    console.log('[AI] Amount:', result.amount);
    console.log('[AI] =====================================');
    
    return result;
  });
}

/**
 * Analyze a document image using Groq's Vision API (fallback)
 */
export async function analyzeDocument(imageUrl: string, isTestMode: boolean = false): Promise<DocumentAnalysis> {
  if (isTestMode || imageUrl.startsWith('file://') || imageUrl.startsWith('/')) {
    console.log('[AI] Test mode - generating mock analysis');
    
    const mockResponses: DocumentAnalysis[] = [
      {
        title: 'Driving Licence - Test User',
        amount: null,
        due_date: '2042-01-26',
        category: 'Other',
        summary_bullets: ['Driving Licence', 'Valid for LMV', 'Valid until 2042'],
        is_scam: false,
        risk_score: 0,
      },
    ];
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockResponses[0];
  }
  
  return rateLimiter.queueRequest(async () => {
    console.log('[AI] Using Vision API...');
    
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: INDIAN_DOCUMENT_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    let parsedResponse: unknown;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResponse = JSON.parse(jsonString.trim());
    } catch {
      throw new Error('Failed to parse AI response');
    }

    return validateDocumentAnalysis(parsedResponse);
  });
}


/**
 * Summarize text into bullet points
 */
export async function summarizeText(text: string): Promise<string[]> {
  return rateLimiter.queueRequest(async () => {
    const response = await groq.chat.completions.create({
      model: 'llama-3-70b-8192',
      messages: [
        {
          role: 'system',
          content: 'Summarize text into 3 concise bullet points. Respond with JSON array of strings.',
        },
        {
          role: 'user',
          content: `Summarize:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');

    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonString.trim());
      
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
      throw new Error('Invalid format');
    } catch {
      const bullets = content
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .slice(0, 3);
      
      return bullets.length > 0 ? bullets : ['Summary not available'];
    }
  });
}

/**
 * Queue a request through the rate limiter
 */
export function queueRequest<T>(request: () => Promise<T>): Promise<T> {
  return rateLimiter.queueRequest(request);
}

// Export AI service
export const aiService: AIService = {
  analyzeDocument,
  summarizeText,
  queueRequest,
};

// Email Analysis Prompt
const EMAIL_ANALYSIS_PROMPT = `Analyze transactional emails and extract:
{
  "vendor_name": "Company name",
  "action_type": "payment_due" | "order_confirmation" | "shipping_update" | "account_alert" | "subscription" | "other",
  "due_date": null or "YYYY-MM-DD",
  "amount": null or number,
  "category": "Finance" | "Education" | "Shopping" | "Health" | "Career" | "Other",
  "summary_bullets": ["bullet1", "bullet2", "bullet3"],
  "is_transactional": true or false
}
Respond with JSON only.`;

/**
 * Analyze an email
 */
export async function analyzeEmail(emailContent: EmailContent): Promise<EmailAnalysis> {
  return rateLimiter.queueRequest(async () => {
    const emailText = `From: ${emailContent.from}\nSubject: ${emailContent.subject}\nDate: ${emailContent.date}\n\n${emailContent.body}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3-70b-8192',
      messages: [
        { role: 'system', content: EMAIL_ANALYSIS_PROMPT },
        { role: 'user', content: emailText },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');

    let parsed: unknown;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonString.trim());
    } catch {
      throw new Error('Failed to parse response');
    }

    const data = parsed as Record<string, unknown>;
    return {
      vendor_name: typeof data.vendor_name === 'string' ? data.vendor_name : 'Unknown',
      action_type: typeof data.action_type === 'string' ? data.action_type : 'other',
      due_date: typeof data.due_date === 'string' ? data.due_date : null,
      amount: typeof data.amount === 'number' ? data.amount : null,
      category: VALID_CATEGORIES.includes(data.category as ItemCategory) ? (data.category as ItemCategory) : 'Other',
      summary_bullets: Array.isArray(data.summary_bullets) ? data.summary_bullets.filter((s): s is string => typeof s === 'string') : [],
      is_transactional: typeof data.is_transactional === 'boolean' ? data.is_transactional : false,
    };
  });
}

/**
 * Generate insight summary
 */
export async function generateInsightSummary(content: string): Promise<InsightSummary> {
  return rateLimiter.queueRequest(async () => {
    const response = await groq.chat.completions.create({
      model: 'llama-3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `Generate 3-bullet summary in JSON:
{
  "obligation": "What user must do",
  "deadline": "When it's due",
  "consequence": "What happens if not done"
}`,
        },
        { role: 'user', content },
      ],
      temperature: 0.2,
      max_tokens: 512,
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error('No response');

    let parsed: unknown;
    try {
      const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        responseContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        responseContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseContent;
      parsed = JSON.parse(jsonString.trim());
    } catch {
      throw new Error('Failed to parse response');
    }

    const data = parsed as Record<string, unknown>;
    return {
      obligation: typeof data.obligation === 'string' ? data.obligation : 'Action required',
      deadline: typeof data.deadline === 'string' ? data.deadline : 'No deadline',
      consequence: typeof data.consequence === 'string' ? data.consequence : 'No penalty mentioned',
    };
  });
}

/**
 * Convert email analysis to item data
 */
export function emailToItemData(
  emailAnalysis: EmailAnalysis,
  emailContent: EmailContent,
  userId: string,
  emailAccountId: string
) {
  return {
    user_id: userId,
    title: `${emailAnalysis.vendor_name} - ${emailContent.subject}`.slice(0, 100),
    category: emailAnalysis.category,
    amount: emailAnalysis.amount,
    due_date: emailAnalysis.due_date,
    summary: emailAnalysis.summary_bullets,
    status: 'new' as const,
    image_url: null,
    is_scam: false,
    folder_id: null,
    source_type: 'email' as const,
    email_id: emailContent.id,
    email_account_id: emailAccountId,
    life_stack_id: null,
    risk_score: 0,
  };
}

export default aiService;
