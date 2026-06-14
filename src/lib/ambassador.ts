import { db } from '@/lib/db';

/**
 * Get ambassador status for a user, including commissions
 */
export async function getAmbassadorStatus(userId: string) {
  const ambassador = await db.ambassador.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          country: true,
        },
      },
      commissions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  return ambassador;
}

/**
 * Apply as an ambassador — creates a new Ambassador record
 */
export async function applyAsAmbassador(userId: string) {
  // Check if already an ambassador
  const existing = await db.ambassador.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error('User is already an ambassador');
  }

  // Generate a unique referral code
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const namePrefix = user?.name
    ? user.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    : 'AMB';
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const referralCode = `${namePrefix}${randomSuffix}`;

  const ambassador = await db.ambassador.create({
    data: {
      userId,
      referralCode,
      referralLink: `/ref/${referralCode}`,
      status: 'pending',
      tier: 'bronze',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          country: true,
        },
      },
    },
  });

  return ambassador;
}

/**
 * Get commission history for an ambassador user
 */
export async function getCommissionHistory(
  userId: string,
  options?: {
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Find the ambassador record for this user
  const ambassador = await db.ambassador.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!ambassador) {
    return { commissions: [], total: 0, pagination: { page, limit, total: 0, pages: 0 } };
  }

  const where: Record<string, unknown> = { ambassadorId: ambassador.id };
  if (options?.status) where.status = options.status;

  const [commissions, total] = await Promise.all([
    db.ambassadorCommission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.ambassadorCommission.count({ where }),
  ]);

  return {
    commissions,
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
