// AfriBayit — Fraud Detection Engine
// CDC §7 — Détection de fraude automatisée pour les annonces immobilières
//
// Checks:
//   1. Price anomaly (too low/high vs market)
//   2. Duplicate listing detection
//   3. Photo reverse search hash
//   4. Seller account age & reputation
//   5. Document consistency
//
// Returns: { riskScore (0-100), riskLevel, flags[], recommendation }

import { db } from '@/lib/db';

// ============ Types ============

export interface FraudCheckInput {
  propertyId?: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  surface: number;
  city: string;
  country: string;
  quartier: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  images?: string[];
  agentId: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FraudFlag {
  type: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  detail: string;
  score: number; // points added to risk score
}

export interface FraudResult {
  riskScore: number;       // 0-100
  riskLevel: RiskLevel;
  flags: FraudFlag[];
  recommendation: string;
  requiresManualReview: boolean;
}

// ============ Main Function ============

/**
 * Detect fraud for a property listing.
 * Runs multiple checks and aggregates risk score.
 */
export async function detectFraud(listing: FraudCheckInput): Promise<FraudResult> {
  const flags: FraudFlag[] = [];

  // Run all checks in parallel
  const [priceAnomalyFlags, duplicateFlags, photoFlags, sellerFlags, docFlags] = await Promise.all([
    checkPriceAnomaly(listing),
    checkDuplicateListings(listing),
    checkPhotoHashes(listing),
    checkSellerReputation(listing),
    checkDocumentConsistency(listing),
  ]);

  flags.push(...priceAnomalyFlags, ...duplicateFlags, ...photoFlags, ...sellerFlags, ...docFlags);

  // Calculate total risk score
  const riskScore = Math.min(100, flags.reduce((sum, f) => sum + f.score, 0));

  // Determine risk level
  const riskLevel: RiskLevel =
    riskScore >= 75 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'medium' : 'low';

  // Generate recommendation
  const recommendation = generateRecommendation(riskScore, flags);

  // Requires manual review if high or critical
  const requiresManualReview = riskScore >= 50;

  return {
    riskScore,
    riskLevel,
    flags,
    recommendation,
    requiresManualReview,
  };
}

// ============ Check Functions ============

/**
 * Check 1: Price anomaly detection
 * Compares asking price vs market average for the area/type
 */
async function checkPriceAnomaly(listing: FraudCheckInput): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  try {
    const avgResult = await db.property.aggregate({
      where: {
        type: listing.type,
        city: listing.city,
        country: listing.country,
        status: 'published',
        surface: { gte: listing.surface * 0.3, lte: listing.surface * 3 },
      },
      _avg: { price: true, surface: true },
      _count: true,
    });

    if (avgResult._count < 3 || !avgResult._avg.price || !avgResult._avg.surface) {
      // Not enough data — light check only
      if (listing.price <= 0) {
        flags.push({
          type: 'price_anomaly',
          severity: 'critical',
          message: 'Prix invalide',
          detail: 'Le prix est nul ou négatif',
          score: 50,
        });
      }
      return flags;
    }

    const avgPricePerSqm = avgResult._avg.price / avgResult._avg.surface;
    const listingPricePerSqm = listing.price / listing.surface;
    const ratio = listingPricePerSqm / avgPricePerSqm;

    // Price too low (potential scam — "too good to be true")
    if (ratio <= 0.3) {
      flags.push({
        type: 'price_anomaly',
        severity: 'critical',
        message: 'Prix anormalement bas',
        detail: `Prix ${Math.round((1 - ratio) * 100)}% en dessous du marché (${formatXOF(listingPricePerSqm)}/m² vs moy. ${formatXOF(avgPricePerSqm)}/m²)`,
        score: 40,
      });
    } else if (ratio <= 0.5) {
      flags.push({
        type: 'price_anomaly',
        severity: 'danger',
        message: 'Prix très en dessous du marché',
        detail: `Prix ${Math.round((1 - ratio) * 100)}% en dessous du marché`,
        score: 25,
      });
    } else if (ratio <= 0.7) {
      flags.push({
        type: 'price_anomaly',
        severity: 'warning',
        message: 'Prix en dessous du marché',
        detail: `Prix ${Math.round((1 - ratio) * 100)}% en dessous de la moyenne`,
        score: 10,
      });
    }

    // Price too high (potential money laundering or overpricing)
    if (ratio >= 3.0) {
      flags.push({
        type: 'price_anomaly',
        severity: 'critical',
        message: 'Prix anormalement élevé',
        detail: `Prix ${Math.round(ratio * 100)}% au-dessus du marché`,
        score: 30,
      });
    } else if (ratio >= 2.0) {
      flags.push({
        type: 'price_anomaly',
        severity: 'danger',
        message: 'Prix très au-dessus du marché',
        detail: `Prix ${Math.round(ratio * 100)}% au-dessus de la moyenne`,
        score: 15,
      });
    }
  } catch {
    // DB error — skip this check
  }

  return flags;
}

/**
 * Check 2: Duplicate listing detection
 * Detects same property listed multiple times (potentially by different agents)
 */
async function checkDuplicateListings(listing: FraudCheckInput): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  try {
    // Search for similar listings in the same area with similar price/surface
    const priceTolerance = listing.price * 0.15;
    const surfaceTolerance = listing.surface * 0.15;

    const similarListings = await db.property.findMany({
      where: {
        status: { in: ['published', 'pending', 'ai_review', 'human_review', 'draft'] },
        type: listing.type,
        city: listing.city,
        quartier: listing.quartier,
        price: { gte: listing.price - priceTolerance, lte: listing.price + priceTolerance },
        surface: { gte: listing.surface - surfaceTolerance, lte: listing.surface + surfaceTolerance },
      },
      select: {
        id: true,
        title: true,
        agentId: true,
        lat: true,
        lng: true,
        address: true,
        createdAt: true,
      },
      take: 20,
    });

    // Filter out the current listing if it exists
    const filtered = listing.propertyId
      ? similarListings.filter(l => l.id !== listing.propertyId)
      : similarListings;

    // Check for exact same address or very close coordinates
    for (const existing of filtered) {
      // Same address check
      if (listing.address && existing.address &&
          listing.address.toLowerCase().trim() === existing.address.toLowerCase().trim()) {
        const sameAgent = existing.agentId === listing.agentId;
        flags.push({
          type: 'duplicate_listing',
          severity: sameAgent ? 'warning' : 'danger',
          message: sameAgent ? 'Annonce en double (même agent)' : 'Annonce en double (agent différent)',
          detail: `Bien similaire trouvé: "${existing.title}" (ID: ${existing.id})`,
          score: sameAgent ? 15 : 30,
        });
        break; // Only flag once
      }

      // Very close coordinates (< 50m apart)
      if (listing.lat && listing.lng && existing.lat && existing.lng) {
        const distance = haversineDistance(listing.lat, listing.lng, existing.lat, existing.lng);
        if (distance < 0.05) { // < 50m
          const sameAgent = existing.agentId === listing.agentId;
          flags.push({
            type: 'duplicate_listing',
            severity: sameAgent ? 'warning' : 'danger',
            message: sameAgent ? 'Coordonnées en double (même agent)' : 'Coordonnées en double (agent différent)',
            detail: `Bien à ${Math.round(distance * 1000)}m trouvé: "${existing.title}" (ID: ${existing.id})`,
            score: sameAgent ? 15 : 30,
          });
          break;
        }
      }
    }

    // Multiple listings by same agent in same quartier (potential spam)
    const sameAgentListings = filtered.filter(l => l.agentId === listing.agentId);
    if (sameAgentListings.length >= 3) {
      flags.push({
        type: 'duplicate_listing',
        severity: 'warning',
        message: 'Multiples annonces du même agent',
        detail: `${sameAgentListings.length} annonces similaires par le même agent dans le même quartier`,
        score: 10,
      });
    }
  } catch {
    // DB error — skip
  }

  return flags;
}

/**
 * Check 3: Photo hash/reverse search check
 * Detects reused or stock photos across different listings
 */
async function checkPhotoHashes(listing: FraudCheckInput): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  if (!listing.images || listing.images.length === 0) {
    flags.push({
      type: 'photo_check',
      severity: 'warning',
      message: 'Aucune photo fournie',
      detail: 'Les annonces sans photo ont un risque de fraude plus élevé',
      score: 8,
    });
    return flags;
  }

  try {
    // Check for images used in other listings
    // In production, this would use perceptual hashing (pHash) for near-duplicate detection
    // For now, we check for exact URL matches
    for (const imageUrl of listing.images) {
      if (!imageUrl) continue;

      const matches = await db.propertyImage.count({
        where: {
          url: imageUrl,
        },
      });

      if (matches > 0) {
        // Image already used in another listing
        const otherProperties = await db.propertyImage.findMany({
          where: { url: imageUrl },
          select: { propertyId: true },
          take: 5,
        });

        const isOwnProperty = listing.propertyId &&
          otherProperties.some(p => p.propertyId === listing.propertyId);

        if (!isOwnProperty && otherProperties.length > 0) {
          flags.push({
            type: 'photo_check',
            severity: 'danger',
            message: 'Photo réutilisée d\'une autre annonce',
            detail: `Image trouvée dans ${otherProperties.length} autre(s) bien(s)`,
            score: 20,
          });
          break; // Only flag once
        }
      }
    }

    // Check for suspicious stock photo URLs
    const stockPhotoDomains = ['istockphoto', 'shutterstock', 'gettyimages', 'pexels', 'unsplash', 'dreamstime'];
    const stockCount = listing.images.filter(url =>
      stockPhotoDomains.some(domain => url.toLowerCase().includes(domain))
    ).length;

    if (stockCount > 0 && stockCount === listing.images.length) {
      flags.push({
        type: 'photo_check',
        severity: 'warning',
        message: 'Uniquement des photos stock',
        detail: `${stockCount} photos proviennent de banques d'images`,
        score: 12,
      });
    } else if (stockCount > 0) {
      flags.push({
        type: 'photo_check',
        severity: 'info',
        message: 'Photos stock détectées',
        detail: `${stockCount} photo(s) proviennent de banques d'images`,
        score: 3,
      });
    }
  } catch {
    // DB error — skip
  }

  return flags;
}

/**
 * Check 4: Seller account age & reputation
 * New accounts with high-value listings are suspicious
 */
async function checkSellerReputation(listing: FraudCheckInput): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  try {
    const seller = await db.user.findUnique({
      where: { id: listing.agentId },
      select: {
        id: true,
        createdAt: true,
        role: true,
        verified: true,
        verificationStatus: true,
        score: true,
        kycLevel: true,
        credibilityScore: true,
        properties: {
          select: { id: true, status: true },
          take: 50,
        },
      },
    });

    if (!seller) {
      flags.push({
        type: 'seller_reputation',
        severity: 'danger',
        message: 'Vendeur introuvable',
        detail: 'Le compte agent n\'existe pas dans la base de données',
        score: 40,
      });
      return flags;
    }

    // Account age check
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (accountAgeDays < 1 && listing.price > 5000000) {
      flags.push({
        type: 'seller_reputation',
        severity: 'critical',
        message: 'Compte très récent + bien de haute valeur',
        detail: `Compte créé il y a ${accountAgeDays} jour(s), bien à ${formatXOF(listing.price)} FCFA`,
        score: 30,
      });
    } else if (accountAgeDays < 7 && listing.price > 10000000) {
      flags.push({
        type: 'seller_reputation',
        severity: 'danger',
        message: 'Compte récent + bien de haute valeur',
        detail: `Compte créé il y a ${accountAgeDays} jours`,
        score: 20,
      });
    } else if (accountAgeDays < 3) {
      flags.push({
        type: 'seller_reputation',
        severity: 'info',
        message: 'Compte récent',
        detail: `Compte créé il y a ${accountAgeDays} jours`,
        score: 3,
      });
    }

    // Verification status
    if (!seller.verified) {
      flags.push({
        type: 'seller_reputation',
        severity: 'warning',
        message: 'Vendeur non vérifié',
        detail: 'Le compte agent n\'est pas vérifié',
        score: 10,
      });
    }

    if (seller.verificationStatus === 'REJECTED') {
      flags.push({
        type: 'seller_reputation',
        severity: 'danger',
        message: 'Certification agent rejetée',
        detail: 'La certification de cet agent a été rejetée',
        score: 25,
      });
    }

    // Low credibility score
    if (seller.credibilityScore < 20) {
      flags.push({
        type: 'seller_reputation',
        severity: 'warning',
        message: 'Score de crédibilité faible',
        detail: `Score: ${seller.credibilityScore}/100`,
        score: 8,
      });
    }

    // Low KYC level
    if (seller.kycLevel < 1) {
      flags.push({
        type: 'seller_reputation',
        severity: 'warning',
        message: 'KYC non complété',
        detail: 'Niveau KYC 0 — aucun document d\'identité vérifié',
        score: 8,
      });
    }

    // High rejection rate
    const totalListings = seller.properties.length;
    if (totalListings >= 3) {
      const rejectedListings = seller.properties.filter(p => p.status === 'rejected').length;
      const rejectionRate = rejectedListings / totalListings;
      if (rejectionRate >= 0.5) {
        flags.push({
          type: 'seller_reputation',
          severity: 'danger',
          message: 'Taux de rejet élevé',
          detail: `${rejectedListings}/${totalListings} annonces rejetées (${Math.round(rejectionRate * 100)}%)`,
          score: 20,
        });
      } else if (rejectionRate >= 0.3) {
        flags.push({
          type: 'seller_reputation',
          severity: 'warning',
          message: 'Taux de rejet modéré',
          detail: `${rejectedListings}/${totalListings} annonces rejetées`,
          score: 10,
        });
      }
    }
  } catch {
    // DB error — skip
  }

  return flags;
}

/**
 * Check 5: Document consistency
 * Verifies that provided documents match the listing details
 */
async function checkDocumentConsistency(listing: FraudCheckInput): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  try {
    if (!listing.propertyId) return flags; // Can only check existing properties

    const legalDocs = await db.propertyLegalDoc.findMany({
      where: { propertyId: listing.propertyId },
      select: {
        id: true,
        docType: true,
        ocrValid: true,
        aiScore: true,
        status: true,
        rejectionReason: true,
      },
    });

    if (legalDocs.length === 0) {
      // No documents at all
      if (listing.price > 5000000) {
        flags.push({
          type: 'document_consistency',
          severity: 'warning',
          message: 'Aucun document juridique',
          detail: 'Bien de valeur sans document légal fourni',
          score: 12,
        });
      }
      return flags;
    }

    // Check for rejected documents
    const rejectedDocs = legalDocs.filter(d => d.status === 'rejected');
    if (rejectedDocs.length > 0) {
      flags.push({
        type: 'document_consistency',
        severity: 'danger',
        message: 'Documents rejetés',
        detail: `${rejectedDocs.length} document(s) rejeté(s): ${rejectedDocs.map(d => d.docType).join(', ')}`,
        score: 20,
      });
    }

    // Check for low AI scores
    const lowScoreDocs = legalDocs.filter(d => d.aiScore !== null && d.aiScore < 50);
    if (lowScoreDocs.length > 0) {
      flags.push({
        type: 'document_consistency',
        severity: 'warning',
        message: 'Documents avec score IA faible',
        detail: `${lowScoreDocs.length} document(s) avec score < 50: ${lowScoreDocs.map(d => `${d.docType} (${d.aiScore})`).join(', ')}`,
        score: 12,
      });
    }

    // Check OCR validation status
    const pendingDocs = legalDocs.filter(d => d.status === 'pending');
    if (pendingDocs.length === legalDocs.length) {
      flags.push({
        type: 'document_consistency',
        severity: 'info',
        message: 'Documents en attente de validation',
        detail: `${pendingDocs.length} document(s) non encore validé(s)`,
        score: 3,
      });
    }

    // Check required documents by country
    const requiredDocsByCountry: Record<string, string[]> = {
      BJ: ['titre_foncier', 'acd'],
      CI: ['titre_foncier', 'decision_parcelle'],
      BF: ['puh', 'lettre_attribution'],
      TG: ['certificat_propriete_andf', 'acte_cession'],
    };

    const requiredDocs = requiredDocsByCountry[listing.country] || [];
    if (requiredDocs.length > 0) {
      const existingDocTypes = new Set(legalDocs.map(d => d.docType));
      const missingDocs = requiredDocs.filter(rd => !existingDocTypes.has(rd));
      if (missingDocs.length > 0) {
        flags.push({
          type: 'document_consistency',
          severity: 'warning',
          message: 'Documents obligatoires manquants',
          detail: `Manquant(s) pour ${listing.country}: ${missingDocs.join(', ')}`,
          score: 10,
        });
      }
    }
  } catch {
    // DB error — skip
  }

  return flags;
}

// ============ Helpers ============

function generateRecommendation(riskScore: number, flags: FraudFlag[]): string {
  if (riskScore >= 75) {
    const criticalFlags = flags.filter(f => f.severity === 'critical');
    return `REJET AUTOMATIQUE — Risque critique détecté. ${criticalFlags.map(f => f.message).join('; ')}. Recommandation: rejeter l'annonce et signaler le compte.`;
  }

  if (riskScore >= 50) {
    const dangerFlags = flags.filter(f => f.severity === 'danger');
    return `REVISION MANUELLE REQUISE — Risque élevé. ${dangerFlags.map(f => f.message).join('; ')}. Recommandation: soumettre à un modérateur pour validation.`;
  }

  if (riskScore >= 25) {
    const warningFlags = flags.filter(f => f.severity === 'warning');
    return `ATTENTION — Risque modéré. ${warningFlags.map(f => f.message).join('; ')}. Recommandation: publier avec surveillance.`;
  }

  return 'FAIBLE RISQUE — Aucune anomalie significative détectée. Publication autorisée.';
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatXOF(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}
