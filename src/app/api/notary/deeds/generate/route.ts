import { NextRequest, NextResponse } from 'next/server';
import { generateDeedDraft, type TransactionData } from '@/lib/notary/deed-generator';
import { getTemplateById, getTemplatesForCountry } from '@/lib/notary/deed-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, templateId, data } = body as {
      transactionId: string;
      templateId: string;
      data: TransactionData;
    };

    if (!transactionId || !templateId) {
      return NextResponse.json(
        { error: 'transactionId et templateId sont requis' },
        { status: 400 }
      );
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template non trouvé', availableTemplates: Object.keys(getTemplatesForCountry(data.country || 'BJ')) },
        { status: 404 }
      );
    }

    const deed = await generateDeedDraft(transactionId, templateId, data);

    return NextResponse.json({
      success: true,
      deed: {
        id: deed.id,
        templateId: deed.templateId,
        transactionId: deed.transactionId,
        country: deed.country,
        deedType: deed.deedType,
        title: deed.title,
        sections: deed.sections,
        generatedAt: deed.generatedAt,
        status: deed.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération de l\'acte';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'BJ';

  const templates = getTemplatesForCountry(country);

  return NextResponse.json({
    country,
    templates: templates.map(t => ({
      id: t.id,
      deedType: t.deedType,
      nameFr: t.nameFr,
      description: t.description,
      legalBasis: t.legalBasis,
      sectionsCount: t.sections.length,
      placeholdersCount: t.placeholders.length,
    })),
  });
}
