import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { userRegisterSchema } from '@/lib/validations/user.schema';

const SELF_REGISTER_ALLOWED_ROLES = new Set(['buyer','seller','investor','tourist','artisan','agent','hotelier','trainer']);

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request);
    const rlResult = await rateLimit(`register:${rlKey}`, 5, 60 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives d\'inscription.', code: 'RATE_LIMITED', retryAfter: rlResult.retryAfter }, { status: 429, headers: { 'Retry-After': String(rlResult.retryAfter) } });
    }
    const body = await request.json();
    const parsed = userRegisterSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', code: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });
    const { email, password, name, phone, country, city, role } = parsed.data;
    const assignedRole = SELF_REGISTER_ALLOWED_ROLES.has(role) ? role : 'buyer';
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 409 });
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({ data: { email, name, password: hashedPassword, phone: phone || null, country: country || null, city: city || null, role: assignedRole, kycLevel: 0, verified: false }, select: { id: true, email: true, name: true, role: true, country: true, kycLevel: true, createdAt: true } });
    return NextResponse.json({ user, message: 'Compte créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}
