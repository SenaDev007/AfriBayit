type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function getClientIpFromHeaders(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

export function checkRateLimit(params: {
  key: string
  maxRequests: number
  windowMs: number
}) {
  const now = Date.now()
  const existing = buckets.get(params.key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs })
    return { allowed: true, remaining: params.maxRequests - 1, resetAt: now + params.windowMs }
  }

  if (existing.count >= params.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  buckets.set(params.key, existing)
  return { allowed: true, remaining: params.maxRequests - existing.count, resetAt: existing.resetAt }
}
