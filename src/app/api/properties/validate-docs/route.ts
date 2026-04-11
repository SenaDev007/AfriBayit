import { NextRequest, NextResponse } from "next/server";
import { validateLegalDoc, LEGAL_DOCS_BY_COUNTRY } from "@/lib/legalDocs";
import { z } from "zod";

const schema = z.object({
  country: z.string(),
  docCode: z.string(),
});

/**
 * POST /api/properties/validate-docs
 * Validates a legal document type against the country matrix (§10B CDC)
 * Returns status: ACCEPTED | CONDITIONAL | REJECTED + instructions
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres requis : country, docCode" },
      { status: 400 }
    );
  }

  const { country, docCode } = parsed.data;

  const { found, info } = validateLegalDoc(country, docCode);

  if (!found) {
    return NextResponse.json(
      {
        status: "COUNTRY_NOT_SUPPORTED",
        message: `Le pays "${country}" n'est pas encore dans la Phase 1 d'AfriBayit (BJ, CI, BF, TG).`,
      },
      { status: 422 }
    );
  }

  if (!info) {
    const allDocs = LEGAL_DOCS_BY_COUNTRY[country as keyof typeof LEGAL_DOCS_BY_COUNTRY] ?? [];
    return NextResponse.json(
      {
        status: "UNKNOWN_DOC",
        message: `Type de document "${docCode}" inconnu pour le ${country}.`,
        availableDocs: allDocs.map((d) => ({ code: d.code, label: d.label, status: d.status })),
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    status: info.status,
    docCode: info.code,
    label: info.label,
    authority: info.authority,
    note: info.note,
    message:
      info.status === "ACCEPTED"
        ? "Document accepté — procédure standard de validation sous 24-72h."
        : info.status === "CONDITIONAL"
        ? "Document conditionnel — transmis au Country Admin pour validation humaine."
        : "Document refusé — ce type de document n'est pas juridiquement valide pour ce pays.",
  });
}

/**
 * GET /api/properties/validate-docs?country=BJ
 * Returns all valid document types for a country
 */
export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");

  if (!country) {
    return NextResponse.json(
      { error: "Paramètre requis : country" },
      { status: 400 }
    );
  }

  const docs = LEGAL_DOCS_BY_COUNTRY[country as keyof typeof LEGAL_DOCS_BY_COUNTRY];

  if (!docs) {
    return NextResponse.json(
      {
        error: `Pays "${country}" non supporté en Phase 1. Pays disponibles : BJ, CI, BF, TG.`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    country,
    documents: docs.map((d) => ({
      code: d.code,
      label: d.label,
      status: d.status,
      authority: d.authority,
      note: d.note,
    })),
  });
}
