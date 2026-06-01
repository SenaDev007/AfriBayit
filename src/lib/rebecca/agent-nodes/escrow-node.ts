// AfriBayit — Escrow Guide Agent Node
// Guides users through the escrow process step by step

import { db } from '@/lib/db';

export interface EscrowGuideState {
  currentStep: string;
  steps: Array<{
    step: string;
    label: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
  }>;
  transactionInfo?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    escrowStatus?: string;
    recentEvents: Array<{
      from: string;
      to: string;
      description: string;
      date: Date;
    }>;
  };
  summary: string;
  nextActions: string[];
}

const ESCROW_STEPS = [
  { step: 'CREATED', label: 'Création', description: 'Transaction créée entre acheteur et vendeur' },
  { step: 'FUNDED', label: 'Financement', description: 'Fonds déposés dans le compte escrow sécurisé' },
  { step: 'DOCS_VALIDATED', label: 'Validation documents', description: 'Documents légaux vérifiés par IA et/ou notaire' },
  { step: 'GEOTRUST_VALIDATED', label: 'GeoTrust', description: 'Vérification géographique et bornage validés' },
  { step: 'NOTARY_ASSIGNED', label: 'Notaire assigné', description: 'Un notaire est désigné pour la transaction' },
  { step: 'NOTARY_IN_PROGRESS', label: 'Notaire en cours', description: 'Le notaire instruit le dossier' },
  { step: 'DEED_SIGNED', label: 'Acte signé', description: 'L\'acte de vente est signé devant notaire' },
  { step: 'ANDF_REGISTERED', label: 'Enregistrement ANDF', description: 'Transaction enregistrée à l\'ANDF' },
  { step: 'RELEASED', label: 'Libération fonds', description: 'Fonds libérés au vendeur après validation complète' },
];

export async function executeEscrowNode(
  state: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entities = (state.entities as Array<{ type: string; value: string }>) || [];
  const message = (state.userMessage as string) || '';
  const userId = state.userId as string | undefined;

  // Check if user has a specific transaction ID
  let transactionId: string | undefined;
  for (const entity of entities) {
    if (entity.type === 'transaction_id') {
      transactionId = entity.value;
    }
  }

  // Also try to extract from message
  if (!transactionId) {
    const txMatch = message.match(/transaction\s+(?:id\s*)?:?\s*([\w-]{10,})/i);
    if (txMatch) transactionId = txMatch[1];
  }

  // Load transaction info if available
  let transactionInfo: EscrowGuideState['transactionInfo'] | undefined;

  if (transactionId || userId) {
    try {
      const where: Record<string, unknown> = {};
      if (transactionId) where.id = transactionId;
      else if (userId) where.buyerId = userId;

      const transaction = await db.transaction.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          escrowAccount: true,
          timelineEvents: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (transaction) {
        transactionInfo = {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          escrowStatus: transaction.escrowAccount?.status,
          recentEvents: transaction.timelineEvents.map((e) => ({
            from: e.fromStatus,
            to: e.toStatus,
            description: e.description,
            date: e.createdAt,
          })),
        };
      }
    } catch (error) {
      console.error('[escrow-node] DB error:', error);
    }
  }

  // Determine current step
  const currentStep = transactionInfo?.status || 'CREATED';

  // Build steps with statuses
  const steps = ESCROW_STEPS.map((s) => {
    const stepIndex = ESCROW_STEPS.findIndex((st) => st.step === currentStep);
    const thisIndex = ESCROW_STEPS.findIndex((st) => st.step === s.step);

    let status: 'completed' | 'current' | 'pending';
    if (thisIndex < stepIndex) status = 'completed';
    else if (thisIndex === stepIndex) status = 'current';
    else status = 'pending';

    return { ...s, status };
  });

  // Build next actions based on current step
  const nextActions = buildNextActions(currentStep, transactionInfo);

  // Build summary
  const summary = buildEscrowSummary(currentStep, transactionInfo, steps);

  return {
    ...state,
    escrowGuide: {
      currentStep,
      steps,
      transactionInfo,
      summary,
      nextActions,
    } satisfies EscrowGuideState,
  };
}

function buildNextActions(currentStep: string, transactionInfo: EscrowGuideState['transactionInfo']): string[] {
  const actions: string[] = [];

  switch (currentStep) {
    case 'CREATED':
      actions.push('Déposez les fonds dans le compte escrow sécurisé pour passer à l\'étape suivante');
      actions.push('Vérifiez les détails de la transaction avant de procéder au paiement');
      break;
    case 'FUNDED':
      actions.push('Soumettez les documents légaux pour validation (Titre Foncier, ACD, etc.)');
      actions.push('Attendez la validation automatique par notre IA');
      break;
    case 'DOCS_VALIDATED':
      actions.push('Planifiez une visite GeoTrust pour la vérification géographique');
      break;
    case 'GEOTRUST_VALIDATED':
      actions.push('Un notaire va être assigné à votre transaction');
      actions.push('Préparez les pièces nécessaires pour le notaire');
      break;
    case 'NOTARY_ASSIGNED':
    case 'NOTARY_IN_PROGRESS':
      actions.push('Suivez les instructions du notaire pour l\'instruction du dossier');
      actions.push('Préparez-vous pour la signature de l\'acte de vente');
      break;
    case 'DEED_SIGNED':
      actions.push('L\'enregistrement à l\'ANDF est en cours');
      break;
    case 'ANDF_REGISTERED':
      actions.push('Les fonds seront libérés au vendeur automatiquement (J+1)');
      break;
    case 'RELEASED':
      actions.push('Transaction terminée! Vérifiez le reçu et le titre de propriété');
      break;
    default:
      actions.push('Contactez notre support pour toute question sur votre transaction');
  }

  if (transactionInfo?.escrowStatus === 'DISPUTED') {
    actions.length = 0;
    actions.push('⚠️ Un litige est en cours sur cette transaction');
    actions.push('Contactez immédiatement notre service de résolution des litiges');
  }

  return actions;
}

function buildEscrowSummary(
  currentStep: string,
  transactionInfo: EscrowGuideState['transactionInfo'] | undefined,
  steps: EscrowGuideState['steps']
): string {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const currentStepInfo = steps.find((s) => s.status === 'current');

  let summary = '🏦 **Processus Escrow AfriBayit**\n\n';

  if (transactionInfo) {
    summary += `Transaction: ${transactionInfo.id}\n`;
    summary += `Montant: ${fmt(transactionInfo.amount)} ${transactionInfo.currency}\n`;
    summary += `Statut: ${currentStepInfo?.label || currentStep}\n`;

    if (transactionInfo.escrowStatus) {
      summary += `Escrow: ${transactionInfo.escrowStatus}\n`;
    }

    if (transactionInfo.recentEvents.length > 0) {
      summary += '\nDerniers événements:\n';
      for (const event of transactionInfo.recentEvents.slice(0, 3)) {
        summary += `• ${event.description}\n`;
      }
    }
  } else {
    summary += 'Le système escrow AfriBayit sécurise vos transactions immobilières:\n\n';

    for (const step of steps) {
      const icon = step.status === 'completed' ? '✅' : step.status === 'current' ? '🔄' : '⬜';
      summary += `${icon} ${step.label}: ${step.description}\n`;
    }

    summary += '\n💡 Les fonds sont bloqués jusqu\'à validation complète, protégeant acheteur et vendeur.';
  }

  return summary;
}
