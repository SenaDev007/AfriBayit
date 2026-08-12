// AfriBayit — Anti-Scraping Protection (CDC §10)
// Headless browser detection, honeypot validation, request pattern analysis,
// rate limiting per endpoint, and CAPTCHA trigger logic

import crypto from 'crypto';

// ====== Types ======

export interface ScrapingCheckResult {
  isBot: boolean;
  confidence: number; // 0-1
  botType: 'headless_browser' | 'scraper' | 'crawler' | 'unknown' | 'human';
  detectedSignals: string[];
  action: 'block' | 'challenge' | 'monitor' | 'allow';
  reason?: string;
}

export interface HoneypotCheckResult {
  triggered: boolean;
  fields: string[];
}

export interface RequestPatternResult {
  isSuspicious: boolean;
  requestCount: number;
  windowMs: number;
  pattern: 'normal' | 'elevated' | 'aggressive' | 'extreme';
  action: 'allow' | 'throttle' | 'challenge' | 'block';
}

export interface CaptchaTriggerResult {
  required: boolean;
  reason: string;
  challengeType: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'math';
  failedAttempts: number;
}

export interface EndpointRateLimit {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// ====== In-Memory Storage ======

interface RequestRecord {
  timestamp: number;
  path: string;
  ip: string;
}

interface FailedAttempt {
  timestamp: number;
  ip: string;
  type: 'login' | 'captcha' | 'api' | 'form';
}

const requestTracker = new Map<string, RequestRecord[]>();
const failedAttempts = new Map<string, FailedAttempt[]>();
const MAX_RECORDS_PER_IP = 500;

// Cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [key, records] of requestTracker) {
    const filtered = records.filter(r => r.timestamp > oneHourAgo);
    if (filtered.length === 0) {
      requestTracker.delete(key);
    } else {
      requestTracker.set(key, filtered);
    }
  }

  for (const [key, attempts] of failedAttempts) {
    const filtered = attempts.filter(a => a.timestamp > oneHourAgo);
    if (filtered.length === 0) {
      failedAttempts.delete(key);
    } else {
      failedAttempts.set(key, filtered);
    }
  }
}, 10 * 60 * 1000);

// ====== Endpoint Rate Limit Configs ======

export const ENDPOINT_RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 },         // 5 per 15 min
  '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 },      // 3 per hour
  '/api/auth/2fa': { maxRequests: 5, windowMs: 15 * 60 * 1000 },           // 5 per 15 min
  '/api/properties/search': { maxRequests: 30, windowMs: 60 * 1000 },      // 30 per min
  '/api/properties': { maxRequests: 60, windowMs: 60 * 1000 },             // 60 per min
  '/api/community/posts': { maxRequests: 10, windowMs: 60 * 1000 },        // 10 per min
  '/api/messages': { maxRequests: 30, windowMs: 60 * 1000 },               // 30 per min
  '/api/payments': { maxRequests: 10, windowMs: 60 * 1000 },               // 10 per min
  '/api/storage/upload': { maxRequests: 20, windowMs: 60 * 1000 },         // 20 per min
  '/api/rebecca/chat': { maxRequests: 20, windowMs: 60 * 1000 },           // 20 per min
  '/api/reviews': { maxRequests: 10, windowMs: 60 * 1000 },                // 10 per min
  '/api/wallet': { maxRequests: 15, windowMs: 60 * 1000 },                 // 15 per min
  '/api/escrow': { maxRequests: 15, windowMs: 60 * 1000 },                 // 15 per min
  default: { maxRequests: 100, windowMs: 60 * 1000 },                       // 100 per min default
};

// ====== Headless Browser Detection ======

/**
 * Detect headless browsers and automated scrapers from request headers.
 */
export function detectHeadlessBrowser(headers: Headers): ScrapingCheckResult {
  const signals: string[] = [];
  let confidence = 0;

  // Check for webdriver indicator
  const webdriver = headers.get('sec-webdriver') || headers.get('x-selenium-webdriver');
  if (webdriver) {
    signals.push('webdriver_present');
    confidence += 0.9;
  }

  // Check for headless chrome
  const userAgent = (headers.get('user-agent') || '').toLowerCase();
  if (userAgent.includes('headlesschrome') || userAgent.includes('headless')) {
    signals.push('headless_chrome');
    confidence += 0.95;
  }

  // Check for phantomJS
  if (userAgent.includes('phantomjs')) {
    signals.push('phantomjs');
    confidence += 0.95;
  }

  // Check for puppeteer/playwright
  if (userAgent.includes('puppeteer') || userAgent.includes('playwright')) {
    signals.push('puppeteer_playwright');
    confidence += 0.95;
  }

  // Missing typical browser headers
  const accept = headers.get('accept');
  const acceptLanguage = headers.get('accept-language');
  const acceptEncoding = headers.get('accept-encoding');
  const secChUa = headers.get('sec-ch-ua');
  const secFetchSite = headers.get('sec-fetch-site');
  const secFetchMode = headers.get('sec-fetch-mode');
  const secFetchDest = headers.get('sec-fetch-dest');

  if (!acceptLanguage) {
    signals.push('missing_accept_language');
    confidence += 0.3;
  }

  if (!acceptEncoding) {
    signals.push('missing_accept_encoding');
    confidence += 0.25;
  }

  if (!secChUa && userAgent.includes('chrome')) {
    signals.push('missing_sec_ch_ua');
    confidence += 0.35;
  }

  if (!secFetchSite) {
    signals.push('missing_sec_fetch_site');
    confidence += 0.2;
  }

  // Suspicious accept header (API-like)
  if (accept && accept.includes('*/*') && !accept.includes('text/html')) {
    signals.push('api_accept_header');
    confidence += 0.2;
  }

  // Known bot user agents
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python-requests/i, /axios/i,
    /node-fetch/i, /got\/\d/i, /superagent/i,
    /httpclient/i, /java\//i, /ruby/i,
    /postman/i, /insomnia/i, /httpie/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      signals.push(`bot_user_agent:${pattern.source}`);
      confidence += 0.7;
      break;
    }
  }

  // Determine bot type
  let botType: ScrapingCheckResult['botType'] = 'human';
  if (confidence >= 0.7) {
    if (signals.includes('headless_chrome') || signals.includes('puppeteer_playwright') || signals.includes('webdriver_present')) {
      botType = 'headless_browser';
    } else if (signals.some(s => s.startsWith('bot_user_agent'))) {
      botType = 'scraper';
    } else {
      botType = 'unknown';
    }
  }

  // Determine action
  let action: ScrapingCheckResult['action'] = 'allow';
  if (confidence >= 0.8) action = 'block';
  else if (confidence >= 0.5) action = 'challenge';
  else if (confidence >= 0.3) action = 'monitor';

  return {
    isBot: confidence >= 0.5,
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
    botType,
    detectedSignals: signals,
    action,
    reason: signals.length > 0 ? `Signaux suspects: ${signals.join(', ')}` : undefined,
  };
}

// ====== Honeypot Field Validation ======

/**
 * Default honeypot field names.
 * These are hidden fields that real users won't fill, but bots will.
 */
export const DEFAULT_HONEYPOT_FIELDS = [
  'website',
  'company_url',
  'fax_number',
  'contact_url',
  'homepage',
  'social_profile',
  'afribayit_hp',   // Custom honeypot
  'verification_url',
];

/**
 * Check if honeypot fields have been filled (indicating a bot).
 */
export function validateHoneypotFields(
  data: Record<string, unknown>,
  honeypotFields: string[] = DEFAULT_HONEYPOT_FIELDS
): HoneypotCheckResult {
  const triggered: string[] = [];

  for (const field of honeypotFields) {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      triggered.push(field);
    } else if (typeof value === 'number' && value !== 0) {
      triggered.push(field);
    }
  }

  return {
    triggered: triggered.length > 0,
    fields: triggered,
  };
}

// ====== Request Pattern Analysis ======

/**
 * Analyze request patterns from a specific IP address.
 * Detects aggressive scraping behavior.
 */
export function analyzeRequestPattern(
  ip: string,
  path: string,
  windowMs: number = 60 * 1000
): RequestPatternResult {
  const key = ip;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Record this request
  if (!requestTracker.has(key)) {
    requestTracker.set(key, []);
  }
  const records = requestTracker.get(key)!;
  records.push({ timestamp: now, path, ip });

  // Keep records bounded
  if (records.length > MAX_RECORDS_PER_IP) {
    records.splice(0, records.length - MAX_RECORDS_PER_IP);
  }

  // Count requests in window
  const recentRequests = records.filter(r => r.timestamp > windowStart);
  const requestCount = recentRequests.length;

  // Check for unique paths (scrapers often hit many different paths)
  const uniquePaths = new Set(recentRequests.map(r => r.path));
  const pathDiversity = uniquePaths.size / Math.max(requestCount, 1);

  // Determine pattern
  let pattern: RequestPatternResult['pattern'] = 'normal';
  let action: RequestPatternResult['action'] = 'allow';
  let isSuspicious = false;

  // High request volume
  if (requestCount > 200) {
    pattern = 'extreme';
    action = 'block';
    isSuspicious = true;
  } else if (requestCount > 100) {
    pattern = 'aggressive';
    action = 'challenge';
    isSuspicious = true;
  } else if (requestCount > 60) {
    pattern = 'elevated';
    action = 'throttle';
    isSuspicious = pathDiversity > 0.7; // Many different paths = likely scraping
  }

  // High path diversity with moderate volume is also suspicious
  if (pathDiversity > 0.8 && requestCount > 20) {
    isSuspicious = true;
    if (pattern === 'normal') {
      pattern = 'elevated';
      action = 'throttle';
    }
  }

  return {
    isSuspicious,
    requestCount,
    windowMs,
    pattern,
    action,
  };
}

// ====== Rate Limiting Per Endpoint ======

/**
 * Check rate limit for a specific endpoint and IP combination.
 */
export function checkEndpointRateLimit(
  ip: string,
  path: string
): EndpointRateLimit {
  const config = ENDPOINT_RATE_LIMITS[path] ?? ENDPOINT_RATE_LIMITS.default;
  const key = `${ip}:${path}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  if (!requestTracker.has(key)) {
    requestTracker.set(key, []);
  }
  const records = requestTracker.get(key)!;

  // Count requests in window for this specific endpoint
  const recentCount = records.filter(r => r.timestamp > windowStart).length;
  const remaining = Math.max(0, config.maxRequests - recentCount);

  if (recentCount >= config.maxRequests) {
    const oldestInWindow = records.find(r => r.timestamp > windowStart);
    const resetAt = oldestInWindow ? oldestInWindow.timestamp + config.windowMs : now + config.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  // Record this request
  records.push({ timestamp: now, path, ip });

  return {
    allowed: true,
    remaining: remaining - 1,
    resetAt: now + config.windowMs,
  };
}

// ====== CAPTCHA Trigger Logic ======

/**
 * Determine if a CAPTCHA challenge should be triggered.
 * Based on failed attempts, suspicious patterns, and bot signals.
 */
export function shouldTriggerCaptcha(
  ip: string,
  attemptType: 'login' | 'api' | 'form' = 'login'
): CaptchaTriggerResult {
  const key = `${ip}:${attemptType}`;
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;

  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, []);
  }
  const attempts = failedAttempts.get(key)!;
  const recentAttempts = attempts.filter(a => a.timestamp > fifteenMinutesAgo);
  const failedCount = recentAttempts.length;

  // Thresholds per attempt type
  const thresholds: Record<string, { warn: number; challenge: number; block: number }> = {
    login: { warn: 2, challenge: 3, block: 10 },
    api: { warn: 5, challenge: 10, block: 30 },
    form: { warn: 3, challenge: 5, block: 15 },
  };

  const threshold = thresholds[attemptType] ?? thresholds.api;

  // Determine if CAPTCHA is required
  if (failedCount >= threshold.block) {
    return {
      required: true,
      reason: `Trop de tentatives echouees (${failedCount}). Compte temporairement bloque.`,
      challengeType: 'recaptcha_v2',
      failedAttempts: failedCount,
    };
  }

  if (failedCount >= threshold.challenge) {
    return {
      required: true,
      reason: `Verification de securite requise apres ${failedCount} tentatives echouees.`,
      challengeType: 'recaptcha_v2',
      failedAttempts: failedCount,
    };
  }

  if (failedCount >= threshold.warn) {
    return {
      required: true,
      reason: `Verification de securite preventive.`,
      challengeType: 'recaptcha_v3',
      failedAttempts: failedCount,
    };
  }

  return {
    required: false,
    reason: '',
    challengeType: 'recaptcha_v3',
    failedAttempts: failedCount,
  };
}

/**
 * Record a failed attempt for CAPTCHA trigger tracking.
 */
export function recordFailedAttempt(ip: string, type: 'login' | 'captcha' | 'api' | 'form'): void {
  const key = `${ip}:${type}`;
  const now = Date.now();

  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, []);
  }
  failedAttempts.get(key)!.push({ timestamp: now, ip, type });

  // Keep bounded
  const attempts = failedAttempts.get(key)!;
  if (attempts.length > 100) {
    attempts.splice(0, attempts.length - 100);
  }
}

/**
 * Clear failed attempts for an IP (after successful action).
 */
export function clearFailedAttempts(ip: string, type?: 'login' | 'captcha' | 'api' | 'form'): void {
  if (type) {
    failedAttempts.delete(`${ip}:${type}`);
  } else {
    // Clear all types for this IP
    for (const key of failedAttempts.keys()) {
      if (key.startsWith(`${ip}:`)) {
        failedAttempts.delete(key);
      }
    }
  }
}

// ====== Comprehensive Anti-Scraping Check ======

/**
 * Run all anti-scraping checks for a request.
 * Returns a comprehensive result combining all detection methods.
 */
export function comprehensiveScrapingCheck(
  headers: Headers,
  path: string,
  body?: Record<string, unknown>
): ScrapingCheckResult & { rateLimit: EndpointRateLimit; patternAnalysis: RequestPatternResult; honeypot: HoneypotCheckResult | null; captcha: CaptchaTriggerResult } {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown';

  // 1. Headless browser detection
  const browserCheck = detectHeadlessBrowser(headers);

  // 2. Honeypot validation (only if body provided)
  const honeypot = body ? validateHoneypotFields(body) : null;

  // 3. Request pattern analysis
  const patternAnalysis = analyzeRequestPattern(ip, path);

  // 4. Endpoint rate limiting
  const rateLimitResult = checkEndpointRateLimit(ip, path);

  // 5. CAPTCHA trigger check
  const captcha = shouldTriggerCaptcha(ip, 'api');

  // Combine signals
  const allSignals = [...browserCheck.detectedSignals];
  let combinedConfidence = browserCheck.confidence;

  if (honeypot?.triggered) {
    allSignals.push(`honeypot_fields: ${honeypot.fields.join(', ')}`);
    combinedConfidence = Math.min(1, combinedConfidence + 0.6);
  }

  if (patternAnalysis.isSuspicious) {
    allSignals.push(`suspicious_pattern: ${patternAnalysis.pattern}`);
    combinedConfidence = Math.min(1, combinedConfidence + 0.3);
  }

  // Determine final action
  let finalAction: ScrapingCheckResult['action'] = browserCheck.action;
  if (!rateLimitResult.allowed) {
    finalAction = 'block';
  } else if (captcha.required && captcha.failedAttempts >= 3) {
    finalAction = 'challenge';
  } else if (honeypot?.triggered) {
    finalAction = 'block';
  } else if (patternAnalysis.action === 'block') {
    finalAction = 'block';
  } else if (patternAnalysis.action === 'challenge' && finalAction !== 'block') {
    finalAction = 'challenge';
  }

  return {
    isBot: combinedConfidence >= 0.5,
    confidence: Math.round(combinedConfidence * 100) / 100,
    botType: browserCheck.botType,
    detectedSignals: allSignals,
    action: finalAction,
    reason: allSignals.length > 0 ? `Protection anti-scraping: ${allSignals.join('; ')}` : undefined,
    rateLimit: rateLimitResult,
    patternAnalysis,
    honeypot,
    captcha,
  };
}
