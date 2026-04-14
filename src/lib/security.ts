import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Security utilities for AfriBayit platform

export class SecurityService {
    // Password security
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 12)
    }

    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash)
    }

    // Generate secure random tokens
    static generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex')
    }

    // Generate 2FA secret
    static generate2FASecret(): string {
        return crypto.randomBytes(20).toString('base32')
    }

    // Generate TOTP code
    static generateTOTP(secret: string): string {
        const epoch = Math.round(new Date().getTime() / 1000.0)
        const time = Math.floor(epoch / 30)
        const timeBuffer = Buffer.alloc(8)
        timeBuffer.writeUInt32BE(time, 4)

        const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'))
        hmac.update(timeBuffer)
        const hmacResult = hmac.digest()

        const offset = hmacResult[hmacResult.length - 1] & 0xf
        const code = ((hmacResult[offset] & 0x7f) << 24) |
            ((hmacResult[offset + 1] & 0xff) << 16) |
            ((hmacResult[offset + 2] & 0xff) << 8) |
            (hmacResult[offset + 3] & 0xff)

        return (code % 1000000).toString().padStart(6, '0')
    }

    // Verify TOTP code
    static verifyTOTP(secret: string, token: string): boolean {
        const generatedToken = this.generateTOTP(secret)
        return generatedToken === token
    }

    // Input sanitization
    static sanitizeInput(input: string): string {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .substring(0, 1000) // Limit length
    }

    // Email validation
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email) && email.length <= 254
    }

    // Phone validation
    static isValidPhone(phone: string): boolean {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        return phoneRegex.test(phone.replace(/\s/g, ''))
    }

    // Rate limiting (simple in-memory implementation)
    private static rateLimitMap = new Map<string, { count: number; resetTime: number }>()

    static checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
        const now = Date.now()
        const key = identifier
        const record = this.rateLimitMap.get(key)

        if (!record || now > record.resetTime) {
            this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
            return true
        }

        if (record.count >= maxRequests) {
            return false
        }

        record.count++
        return true
    }

    // Clean up expired rate limit records
    static cleanupRateLimit(): void {
        const now = Date.now()
        for (const [key, record] of this.rateLimitMap.entries()) {
            if (now > record.resetTime) {
                this.rateLimitMap.delete(key)
            }
        }
    }

    // Generate secure session ID
    static generateSessionId(): string {
        return crypto.randomBytes(32).toString('hex')
    }

    // Encrypt sensitive data
    static encrypt(text: string, key: string): string {
        const algorithm = 'aes-256-gcm'
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipher(algorithm, key)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
    }

    // Decrypt sensitive data
    static decrypt(encryptedText: string, key: string): string {
        const algorithm = 'aes-256-gcm'
        const parts = encryptedText.split(':')
        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]

        const decipher = crypto.createDecipher(algorithm, key)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }

    // Generate CSRF token
    static generateCSRFToken(): string {
        return crypto.randomBytes(32).toString('hex')
    }

    // Verify CSRF token
    static verifyCSRFToken(token: string, sessionToken: string): boolean {
        return token === sessionToken
    }

    // SQL injection prevention
    static sanitizeSQL(input: string): string {
        return input
            .replace(/[';]/g, '') // Remove quotes and semicolons
            .replace(/--/g, '') // Remove SQL comments
            .replace(/\/\*/g, '') // Remove block comments
            .replace(/\*\//g, '')
    }

    // XSS prevention
    static sanitizeHTML(input: string): string {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
    }

    // Validate file upload
    static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Type de fichier non autorisé' }
        }

        if (file.size > maxSize) {
            return { valid: false, error: 'Fichier trop volumineux' }
        }

        return { valid: true }
    }

    // Generate secure filename
    static generateSecureFilename(originalName: string): string {
        const timestamp = Date.now()
        const random = crypto.randomBytes(8).toString('hex')
        const extension = originalName.split('.').pop()
        return `${timestamp}_${random}.${extension}`
    }
}

// Security middleware for API routes
export function withSecurity(handler: Function) {
    return async (req: any, res: any) => {
        try {
            // Add security headers
            res.setHeader('X-Content-Type-Options', 'nosniff')
            res.setHeader('X-Frame-Options', 'DENY')
            res.setHeader('X-XSS-Protection', '1; mode=block')
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            res.setHeader('Content-Security-Policy', "default-src 'self'")

            // Rate limiting
            const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress
            if (!SecurityService.checkRateLimit(clientIP)) {
                return res.status(429).json({ message: 'Trop de requêtes' })
            }

            // Clean up rate limit records periodically
            if (Math.random() < 0.01) { // 1% chance
                SecurityService.cleanupRateLimit()
            }

            return await handler(req, res)
        } catch (error) {
            console.error('Security middleware error:', error)
            return res.status(500).json({ message: 'Erreur de sécurité' })
        }
    }
}

// Export security constants
export const SECURITY_CONSTANTS = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    MAX_REQUESTS_PER_WINDOW: 100,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    ENCRYPTION_ALGORITHM: 'aes-256-gcm',
    TOKEN_LENGTH: 32
}
