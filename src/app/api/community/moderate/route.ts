// AfriBayit — Community Content Moderation API (CDC §5.7.4)
// POST /api/community/moderate — Moderates community content before publication

import { NextResponse } from 'next/server';
import { moderateContent, getModerationStats, getHumanReviewQueue, sanitizeContent, type ContentClassification } from '@/lib/community/moderation';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    const rateResult = rateLimit(`moderate:${rateLimitKey}`, 30, 60 * 1000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de requetes. Reessayez plus tard.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter) } }
      );
    }

    const body = await request.json();
    const { content, authorId, forumTopic, config } = body as {
      content: string;
      authorId?: string;
      forumTopic?: string;
      config?: {
        autoRejectThreshold?: number;
        humanReviewThreshold?: number;
        maxLength?: number;
      };
    };

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Le contenu est requis (chaine de caracteres)' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu ne peut pas etre vide' },
        { status: 400 }
      );
    }

    // Run moderation
    const result = moderateContent(content, config ?? {}, { authorId, forumTopic });

    // Prepare response based on action
    const response: Record<string, unknown> = {
      classification: result.classification,
      confidence: result.confidence,
      action: result.action,
      reasons: result.reasons,
      reportId: result.report.id,
    };

    switch (result.action) {
      case 'auto_reject':
        return NextResponse.json({
          ...response,
          allowed: false,
          message: 'Votre contenu a ete bloque par notre systeme de moderation.',
          details: result.flaggedPatterns.length > 0
            ? `Motifs detectes: ${result.flaggedPatterns.join(', ')}`
            : undefined,
        }, { status: 422 });

      case 'human_review':
        return NextResponse.json({
          ...response,
          allowed: true,
          pendingReview: true,
          message: 'Votre contenu est en attente de verification par notre equipe de moderation. Il sera visible une fois approuve.',
          sanitizedContent: result.sanitizedContent,
        });

      case 'allow':
        return NextResponse.json({
          ...response,
          allowed: true,
          message: 'Contenu autorise.',
        });

      default:
        return NextResponse.json({
          ...response,
          allowed: true,
        });
    }
  } catch (error) {
    console.error('Community moderation API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la moderation du contenu' },
      { status: 500 }
    );
  }
}

// GET — Retrieve moderation stats and human review queue (admin)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      const stats = getModerationStats();
      return NextResponse.json({ stats });
    }

    if (action === 'review_queue') {
      const classification = url.searchParams.get('classification') as ContentClassification | null;
      const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
      const queue = getHumanReviewQueue({
        classification: classification ?? undefined,
        limit,
      });
      return NextResponse.json({ queue, count: queue.length });
    }

    // Default: return both stats and queue summary
    const stats = getModerationStats();
    const recentQueue = getHumanReviewQueue({ limit: 10 });
    return NextResponse.json({ stats, recentQueue });
  } catch (error) {
    console.error('Community moderation GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des donnees de moderation' },
      { status: 500 }
    );
  }
}

// PUT — Sanitize content (for admin actions on human review queue)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { content, classification } = body as {
      content: string;
      classification: ContentClassification;
    };

    if (!content || !classification) {
      return NextResponse.json(
        { error: 'content et classification sont requis' },
        { status: 400 }
      );
    }

    const sanitized = sanitizeContent(content, classification);
    return NextResponse.json({ sanitized });
  } catch (error) {
    console.error('Content sanitization error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage du contenu' },
      { status: 500 }
    );
  }
}
