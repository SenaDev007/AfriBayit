# Qualified Electronic Signature — Design Document (CDC §5.0bis)

## Overview

This document specifies the integration architecture for qualified electronic
signatures on notarial deeds, per CDC §5.0bis. The current implementation stores
signature data as a plain string in `TransactionTimeline.metadata` — this is a
Phase 1 fallback. This document describes the upgrade path to a legally binding
qualified signature.

## Current State (Phase 1 Fallback)

- `src/lib/notary/e-signature.ts` — stores signature metadata as JSON in the `TransactionTimeline` table
- No cryptographic verification of the signature
- No qualified certificate (X.509)
- No timestamp authority (TSA)
- CDC §5.0bis.6 explicitly allows: "Phase 1: signature physique possible en fallback"

## Target State (Phase 2 — Qualified)

### Legal Requirements (OHADA / Benin Law n°2017-20)

1. **Qualified certificate** — X.509 certificate issued by a qualified trust service provider (QTSP)
2. **Advanced electronic signature** — created using a qualified signature creation device (QSCD)
3. **Timestamp authority** — RFC 3161 timestamp from a trusted TSA
4. **Signature validation** — verification of certificate chain, signature value, and timestamp
5. **Long-term validation (LTV)** — archive of validation material for future verification

### Provider Options

| Provider | Coverage | Cost | Integration Effort | Recommendation |
|---|---|---|---|---|
| **DocuSign** | Global, supports OHADA | $$/signature | Low (REST API + SDK) | ✅ Phase 2 |
| **Adobe Sign** | Global | $$/signature | Low (REST API) | Alternative |
| **Notarius** (Africa) | West Africa focused | Custom | Medium | Phase 3 |
| **Local CA (Benin)** | Benin only | Setup cost | High (custom PKI) | Not recommended |

### Recommended: DocuSign Integration

DocuSign is the fastest path to qualified e-signature compliance because:
- REST API with Node.js SDK
- Supports qualified signatures in the EU (eIDAS) — OHADA-compliant
- Built-in audit trail, timestamp authority, and certificate management
- Mobile-first signing flow (critical for African market)
- Webhook notifications for signature status changes

## Integration Architecture

### 1. New Environment Variables

```
DOCUSIGN_INTEGRATION_KEY=     # API key from DocuSign
DOCUSIGN_USER_ID=             # Notary's DocuSign user ID
DOCUSIGN_PRIVATE_KEY=         # RSA private key for JWT auth
DOCUSIGN_ACCOUNT_ID=          # DocuSign account ID
DOCUSIGN_API_BASE=            # https://demo.docusign.net (sandbox) or https://www.docusign.net
```

### 2. New Files

```
src/lib/notary/
├── e-signature.ts          # Existing — Phase 1 fallback (kept for backward compat)
├── qualified-signature.ts  # NEW — DocuSign integration for qualified signatures
└── deed-generator.ts       # Existing — generates the deed PDF to be signed
```

### 3. Qualified Signature Flow

```
1. Notary generates deed PDF (existing: deed-generator.ts)
2. Notary requests qualified signature (new: POST /api/notary/signatures/request)
   → Creates DocuSign envelope with the deed PDF
   → Adds signers (buyer, seller, notary) with their email/phone
   → Sends signing request to all parties
3. Each party signs via DocuSign (web or mobile)
4. DocuSign webhook → POST /api/notary/webhooks/docusign
   → "envelope-completed" event
   → Downloads the signed PDF with certificate + timestamp
   → Stores signed PDF in Cloudflare R2
   → Records signature metadata in TransactionTimeline
   → Triggers escrow DEED_SIGNED transition
5. Verification (anytime):
   → GET /api/notary/signatures/verify/{signatureId}
   → Downloads signed PDF from R2
   → Verifies DocuSign certificate chain + timestamp
```

### 4. Implementation Status

This file documents the design. The actual implementation requires:
1. A DocuSign account with eSignature API access
2. Legal review by the AfriBayit Legal Officer (CDC §5.0bis.6)
3. Agreement with the Chambre Nationale des Notaires du Bénin
4. Integration with the existing `e-signature.ts` module

Until these prerequisites are met, the Phase 1 fallback (DB-stored signature
metadata) remains in use. The fallback is explicitly allowed by the CDC.
