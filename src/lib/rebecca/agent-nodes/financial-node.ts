// AfriBayit — Financial Calculator Agent Node
// Calculates mortgage, ROI, investment scores for property inquiries

export interface FinancialCalcState {
  simulation?: {
    propertyValue: number;
    downPayment: number;
    downPaymentPct: number;
    loanAmount: number;
    annualRate: number;
    durationYears: number;
    monthlyPayment: number;
    totalPaid: number;
    totalInterest: number;
    costOfCredit: number;
  };
  roiAnalysis?: {
    estimatedRentalIncome: number;
    grossYield: number;
    netYield: number;
    paybackPeriod: number;
    investmentGrade: string;
  };
  bankOptions: Array<{
    name: string;
    rate: number;
    duration: string;
    minDownPayment: number;
  }>;
  summary: string;
}

export async function executeFinancialNode(
  state: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entities = (state.entities as Array<{ type: string; value: string }>) || [];
  const message = (state.userMessage as string) || '';

  // Extract financial parameters from entities and message
  let amount = 25_000_000; // Default: 25M FCFA
  let durationYears = 20;
  let downPaymentPct = 20;
  let annualRate = 7.5;

  for (const entity of entities) {
    switch (entity.type) {
      case 'amount': {
        const parsed = parseInt(entity.value.replace(/\s/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) amount = parsed;
        break;
      }
      case 'duration_years': {
        const parsed = parseInt(entity.value, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) durationYears = parsed;
        break;
      }
      case 'interest_rate': {
        const parsed = parseFloat(entity.value.replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0 && parsed < 30) annualRate = parsed;
        break;
      }
    }
  }

  // Also try to extract from the message directly
  const amountMatch = message.match(/(\d[\d\s]*)\s*(?:fcfa|xof|cfa|franc)/i);
  if (amountMatch) {
    const parsed = parseInt(amountMatch[1].replace(/\s/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  const durationMatch = message.match(/(\d+)\s*(?:an|ann[eé]e)/i);
  if (durationMatch) {
    const parsed = parseInt(durationMatch[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) durationYears = parsed;
  }

  const downPaymentMatch = message.match(/(\d+)\s*%\s*(?:apport|apport personnel)/i);
  if (downPaymentMatch) {
    const parsed = parseInt(downPaymentMatch[1], 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) downPaymentPct = parsed;
  }

  // Calculate mortgage simulation
  const simulation = calculateMortgage(amount, durationYears, downPaymentPct, annualRate);

  // Calculate ROI analysis
  const roiAnalysis = calculateROI(amount);

  // Bank comparison options
  const bankOptions = [
    { name: 'BOA (Banque Ouest Africaine)', rate: 7.5, duration: '15-25 ans', minDownPayment: 20 },
    { name: 'Ecobank', rate: 8.0, duration: '10-20 ans', minDownPayment: 25 },
    { name: 'BICEC', rate: 7.0, duration: '15-25 ans', minDownPayment: 20 },
    { name: 'SGBE (Société Générale)', rate: 7.8, duration: '12-20 ans', minDownPayment: 25 },
    { name: 'Banque Atlantique', rate: 7.2, duration: '15-25 ans', minDownPayment: 20 },
  ];

  const summary = buildFinancialSummary(simulation, roiAnalysis);

  return {
    ...state,
    financialCalc: {
      simulation,
      roiAnalysis,
      bankOptions,
      summary,
    } satisfies FinancialCalcState,
  };
}

function calculateMortgage(
  amount: number,
  durationYears: number,
  downPaymentPct: number,
  annualRate: number
) {
  const downPayment = Math.round(amount * (downPaymentPct / 100));
  const loanAmount = amount - downPayment;
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = durationYears * 12;

  const monthlyPayment = monthlyRate > 0
    ? Math.round(
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      )
    : Math.round(loanAmount / totalMonths);

  const totalPaid = monthlyPayment * totalMonths;
  const totalInterest = totalPaid - loanAmount;
  const costOfCredit = Math.round((totalInterest / loanAmount) * 100);

  return {
    propertyValue: amount,
    downPayment,
    downPaymentPct,
    loanAmount,
    annualRate,
    durationYears,
    monthlyPayment,
    totalPaid,
    totalInterest,
    costOfCredit,
  };
}

function calculateROI(propertyValue: number) {
  // Estimate rental income based on West African market (4-8% gross yield)
  const grossYieldPct = 5.5; // Conservative estimate
  const estimatedRentalIncome = Math.round(propertyValue * (grossYieldPct / 100) / 12);

  // Net yield after charges (20-30% of gross)
  const chargesPct = 0.25;
  const netAnnualIncome = estimatedRentalIncome * 12 * (1 - chargesPct);
  const netYield = Math.round((netAnnualIncome / propertyValue) * 1000) / 10;

  // Payback period in years
  const paybackPeriod = Math.round((propertyValue / netAnnualIncome) * 10) / 10;

  // Investment grade
  let investmentGrade: string;
  if (netYield >= 6) investmentGrade = 'A+';
  else if (netYield >= 5) investmentGrade = 'A';
  else if (netYield >= 4) investmentGrade = 'B+';
  else if (netYield >= 3) investmentGrade = 'B';
  else investmentGrade = 'C';

  return {
    estimatedRentalIncome,
    grossYield: grossYieldPct,
    netYield,
    paybackPeriod,
    investmentGrade,
  };
}

function buildFinancialSummary(
  simulation: FinancialCalcState['simulation'],
  roi: FinancialCalcState['roiAnalysis']
): string {
  if (!simulation) return 'Simulation financière non disponible.';

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  let summary = `Pour un bien de ${fmt(simulation.propertyValue)} FCFA avec ${simulation.downPaymentPct}% d'apport (${fmt(simulation.downPayment)} FCFA), `;
  summary += `votre mensualité sera de ${fmt(simulation.monthlyPayment)} FCFA sur ${simulation.durationYears} ans au taux de ${simulation.annualRate}%. `;
  summary += `Coût total du crédit: ${fmt(simulation.totalInterest)} FCFA (${simulation.costOfCredit}% du capital).`;

  if (roi) {
    summary += `\n\nRentabilité estimée: ${roi.grossYield}% brut, ${roi.netYield}% net. `;
    summary += `Loyer estimé: ${fmt(roi.estimatedRentalIncome)} FCFA/mois. `;
    summary += `Délai de récupération: ${roi.paybackPeriod} ans. Grade: ${roi.investmentGrade}.`;
  }

  return summary;
}
