/**
 * Scam Shield - AI-powered phishing and scam detection system
 * Detects urgency language, suspicious senders, and sensitive info requests
 */

export interface ScamAnalysis {
  is_scam: boolean;
  risk_score: number; // 0-100
  scam_indicators: string[];
  recommendation: string;
}

// Urgency language patterns that indicate potential scams
const URGENCY_PATTERNS = [
  'account blocked',
  'account suspended',
  'act now',
  'act immediately',
  'verify immediately',
  'urgent action required',
  'immediate action',
  'your account will be',
  'within 24 hours',
  'within 48 hours',
  'limited time',
  'expires today',
  'final notice',
  'last warning',
  'failure to respond',
  'avoid suspension',
  'prevent closure',
];

// Suspicious request patterns
const SENSITIVE_INFO_PATTERNS = [
  'password',
  'pin number',
  'otp',
  'one-time password',
  'social security',
  'bank account number',
  'credit card number',
  'cvv',
  'security code',
  'login credentials',
  'verify your identity',
  'confirm your details',
  'update your information',
  'click here to verify',
  'click the link below',
];

// Known suspicious domain patterns
const SUSPICIOUS_DOMAIN_PATTERNS = [
  /\d{4,}/, // Many numbers in domain
  /-{2,}/, // Multiple hyphens
  /\.(xyz|top|club|work|click|link|gq|ml|cf|tk)$/i, // Suspicious TLDs
  /paypa[l1]|amaz[o0]n|g[o0]{2}gle|micr[o0]s[o0]ft|app[l1]e/i, // Typosquatting
];

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Check for urgency language in content
 */
function detectUrgencyLanguage(content: string): string[] {
  const lowerContent = content.toLowerCase();
  return URGENCY_PATTERNS.filter((pattern) => lowerContent.includes(pattern));
}

/**
 * Check for sensitive information requests
 */
function detectSensitiveInfoRequests(content: string): string[] {
  const lowerContent = content.toLowerCase();
  return SENSITIVE_INFO_PATTERNS.filter((pattern) => lowerContent.includes(pattern));
}

/**
 * Check for suspicious sender domain
 */
function detectSuspiciousDomain(sender: string): string[] {
  const domain = extractDomain(sender);
  const indicators: string[] = [];

  for (const pattern of SUSPICIOUS_DOMAIN_PATTERNS) {
    if (pattern.test(domain)) {
      indicators.push(`Suspicious domain pattern detected: ${domain}`);
      break;
    }
  }

  return indicators;
}

/**
 * Check for mismatched links (display text vs actual URL)
 */
function detectMismatchedLinks(content: string): string[] {
  const indicators: string[] = [];
  
  // Simple check for common phishing patterns
  const linkPatterns = [
    /click\s+here/i,
    /verify\s+now/i,
    /login\s+here/i,
    /update\s+account/i,
  ];

  for (const pattern of linkPatterns) {
    if (pattern.test(content)) {
      indicators.push('Contains suspicious call-to-action links');
      break;
    }
  }

  return indicators;
}

/**
 * Main scam detection function
 * @param content - Email or document content to analyze
 * @param sender - Sender email address
 * @returns ScamAnalysis with risk assessment
 */
export function detectScam(content: string, sender: string): ScamAnalysis {
  const indicators: string[] = [];
  let riskScore = 0;

  // Check urgency language (high weight)
  const urgencyIndicators = detectUrgencyLanguage(content);
  if (urgencyIndicators.length > 0) {
    indicators.push(`Urgency language detected: ${urgencyIndicators.slice(0, 3).join(', ')}`);
    riskScore += Math.min(urgencyIndicators.length * 15, 40);
  }

  // Check sensitive info requests (high weight)
  const sensitiveIndicators = detectSensitiveInfoRequests(content);
  if (sensitiveIndicators.length > 0) {
    indicators.push(`Requests for sensitive information: ${sensitiveIndicators.slice(0, 3).join(', ')}`);
    riskScore += Math.min(sensitiveIndicators.length * 20, 50);
  }

  // Check suspicious domain (medium weight)
  const domainIndicators = detectSuspiciousDomain(sender);
  if (domainIndicators.length > 0) {
    indicators.push(...domainIndicators);
    riskScore += 25;
  }

  // Check mismatched links (medium weight)
  const linkIndicators = detectMismatchedLinks(content);
  if (linkIndicators.length > 0) {
    indicators.push(...linkIndicators);
    riskScore += 15;
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine if it's a scam (threshold: 70)
  const isScam = riskScore >= 70;

  // Generate recommendation
  let recommendation = '';
  if (riskScore >= 70) {
    recommendation = 'HIGH RISK: This appears to be a scam. Do not click any links or provide personal information.';
  } else if (riskScore >= 40) {
    recommendation = 'MEDIUM RISK: Exercise caution. Verify the sender through official channels before taking action.';
  } else if (riskScore >= 20) {
    recommendation = 'LOW RISK: Some suspicious elements detected. Review carefully before responding.';
  } else {
    recommendation = 'This message appears to be legitimate.';
  }

  return {
    is_scam: isScam,
    risk_score: riskScore,
    scam_indicators: indicators,
    recommendation,
  };
}

/**
 * Quick check if content contains any scam indicators
 * @param content - Content to check
 * @returns true if any scam indicators are found
 */
export function hasScamIndicators(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  return (
    URGENCY_PATTERNS.some((p) => lowerContent.includes(p)) ||
    SENSITIVE_INFO_PATTERNS.some((p) => lowerContent.includes(p))
  );
}

export default detectScam;
