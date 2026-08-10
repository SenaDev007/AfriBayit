// AfriBayit — Enhanced Input Sanitization
// Input validation and sanitization utilities

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;') // Escape ampersands
    .replace(/"/g, '&quot;') // Escape quotes
    .replace(/'/g, '&#x27;') // Escape single quotes
    .trim();
}

/**
 * Sanitize HTML content (basic XSS prevention)
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate and sanitize an email address
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string } {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return {
    valid: emailRegex.test(sanitized),
    sanitized,
  };
}

/**
 * Validate a phone number for West African countries
 */
export function validatePhoneNumber(phone: string, country?: string): { valid: boolean; sanitized: string } {
  const sanitized = phone.replace(/[\s\-()]/g, '');

  const patterns: Record<string, RegExp> = {
    BJ: /^(\+229|00229|0)?[1-9]\d{7}$/,
    CI: /^(\+225|00225|0)?[1-9]\d{7,8}$/,
    BF: /^(\+226|00226|0)?[1-9]\d{7}$/,
    TG: /^(\+228|00228|0)?[1-9]\d{7}$/,
  };

  if (country && patterns[country]) {
    return {
      valid: patterns[country].test(sanitized),
      sanitized,
    };
  }

  // Generic international phone
  const genericPattern = /^\+?[1-9]\d{6,14}$/;
  return {
    valid: genericPattern.test(sanitized),
    sanitized,
  };
}

/**
 * Validate a price/currency amount
 */
export function validatePrice(value: unknown): { valid: boolean; sanitized: number } {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN;
  return {
    valid: !isNaN(num) && num >= 0 && isFinite(num),
    sanitized: Math.max(0, num),
  };
}

/**
 * Validate and sanitize a URL
 */
export function validateUrl(url: string): { valid: boolean; sanitized: string } {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    return {
      valid: allowedProtocols.includes(parsed.protocol),
      sanitized: parsed.href,
    };
  } catch {
    return { valid: false, sanitized: '' };
  }
}

/**
 * Sanitize an object by recursively cleaning all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Check for honeypot field (spam detection)
 * Honeypot fields are hidden form fields that should remain empty
 */
export function checkHoneypot(data: Record<string, unknown>, honeypotFields: string[] = ['website', 'company_url', 'fax']): boolean {
  // Returns true if honeypot is triggered (likely spam)
  return honeypotFields.some((field) => {
    const value = data[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

/**
 * Validate a country code
 */
export function validateCountryCode(code: string): boolean {
  const validCodes = ['BJ', 'CI', 'BF', 'TG'];
  return validCodes.includes(code.toUpperCase());
}

/**
 * Sanitize a search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[<>{}[\]\\]/g, '') // Remove dangerous chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: string | number, limit?: string | number): {
  page: number;
  limit: number;
  valid: boolean;
} {
  const p = typeof page === 'string' ? parseInt(page, 10) : page || 1;
  const l = typeof limit === 'string' ? parseInt(limit, 10) : limit || 20;

  return {
    page: Math.max(1, isNaN(p) ? 1 : p),
    limit: Math.min(100, Math.max(1, isNaN(l) ? 20 : l)),
    valid: p > 0 && l > 0 && l <= 100,
  };
}
