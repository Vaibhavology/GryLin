/**
 * Image Quality Analysis for Scanner
 * Provides real-time feedback on image quality for better AI extraction
 */

export interface QualityAnalysis {
  score: number; // 0-100
  feedback: string | null;
  isAcceptable: boolean;
  issues: QualityIssue[];
}

export type QualityIssue = 'blur' | 'distance' | 'lighting' | 'angle';

interface QualityThresholds {
  blur: number;
  minBrightness: number;
  maxBrightness: number;
  acceptableScore: number;
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  blur: 50,
  minBrightness: 30,
  maxBrightness: 220,
  acceptableScore: 70,
};

/**
 * Analyze image quality based on various factors
 * Note: This is a simplified analysis - real implementation would use
 * native image processing libraries for accurate blur/lighting detection
 */
export function analyzeImageQuality(
  imageData?: {
    width?: number;
    height?: number;
    brightness?: number;
    contrast?: number;
    sharpness?: number;
  },
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS
): QualityAnalysis {
  const issues: QualityIssue[] = [];
  let score = 100;
  let feedback: string | null = null;

  // If no image data, return default acceptable state
  if (!imageData) {
    return {
      score: 75,
      feedback: null,
      isAcceptable: true,
      issues: [],
    };
  }

  // Check brightness (lighting)
  if (imageData.brightness !== undefined) {
    if (imageData.brightness < thresholds.minBrightness) {
      issues.push('lighting');
      score -= 25;
      feedback = 'Improve lighting - too dark';
    } else if (imageData.brightness > thresholds.maxBrightness) {
      issues.push('lighting');
      score -= 20;
      feedback = 'Too bright - reduce glare';
    }
  }

  // Check sharpness (blur detection)
  if (imageData.sharpness !== undefined && imageData.sharpness < thresholds.blur) {
    issues.push('blur');
    score -= 30;
    feedback = feedback || 'Too blurry - hold steady';
  }

  // Check image dimensions (distance estimation)
  if (imageData.width && imageData.height) {
    const minDimension = Math.min(imageData.width, imageData.height);
    if (minDimension < 500) {
      issues.push('distance');
      score -= 20;
      feedback = feedback || 'Move closer to document';
    }
  }

  // Check contrast
  if (imageData.contrast !== undefined && imageData.contrast < 30) {
    score -= 15;
    feedback = feedback || 'Low contrast - adjust angle';
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    feedback,
    isAcceptable: score >= thresholds.acceptableScore,
    issues,
  };
}

/**
 * Get quality feedback message based on score
 */
export function getQualityFeedback(score: number): string {
  if (score >= 90) return 'Excellent quality';
  if (score >= 70) return 'Good quality - ready to capture';
  if (score >= 50) return 'Fair quality - try to improve';
  return 'Poor quality - adjust position';
}

/**
 * Get feedback message for specific issue
 */
export function getIssueFeedback(issue: QualityIssue): string {
  switch (issue) {
    case 'blur':
      return 'Too blurry - hold steady';
    case 'distance':
      return 'Move closer to document';
    case 'lighting':
      return 'Improve lighting';
    case 'angle':
      return 'Adjust angle for better view';
    default:
      return 'Adjust for better quality';
  }
}

/**
 * Simulate quality analysis for demo purposes
 * In production, this would use actual image processing
 */
export function simulateQualityAnalysis(): QualityAnalysis {
  // Simulate varying quality scores for demo
  const randomScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const issues: QualityIssue[] = [];
  let feedback: string | null = null;

  if (randomScore < 70) {
    const possibleIssues: QualityIssue[] = ['blur', 'distance', 'lighting'];
    const randomIssue = possibleIssues[Math.floor(Math.random() * possibleIssues.length)];
    issues.push(randomIssue);
    feedback = getIssueFeedback(randomIssue);
  }

  return {
    score: randomScore,
    feedback,
    isAcceptable: randomScore >= 70,
    issues,
  };
}

export default analyzeImageQuality;
