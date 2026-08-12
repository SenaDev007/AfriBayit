// AfriBayit Certificate PDF Generator — pdfkit + QR code
// CDC §5.6.4 — Enhanced with proper branding, QR verification, and downloadable PDF

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { CertificateType } from './templates';
import { getTemplate } from './templates';

export interface CertificateData {
  certificateId: string;
  recipientName: string;
  courseName: string;
  instructorName: string;
  date: string;
  type: CertificateType;
  verificationUrl: string;
}

// AfriBayit brand colors — CDC
const BRAND = {
  navy: '#003087',
  gold: '#D4AF37',
  blue: '#009CDE',
  green: '#00A651',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  midGray: '#888888',
  darkText: '#2C2E2F',
} as const;

/**
 * Génère un PDF de certificat et retourne le buffer
 */
export async function generateCertificatePDF(
  data: CertificateData
): Promise<Buffer> {
  const template = getTemplate(data.type);

  return new Promise(async (resolve, reject) => {
    try {
      // Générer le QR code contenant l'URL de vérification
      const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        width: 150,
        margin: 1,
        color: { dark: BRAND.navy, light: BRAND.white },
      });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrBuffer = Buffer.from(qrBase64, 'base64');

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
        info: {
          Title: `Certificat AfriBayit — ${data.courseName}`,
          Author: 'AfriBayit Academy',
          Subject: `Certificat de réussite pour ${data.recipientName}`,
          Keywords: 'afribayit, certificat, academy, immobilier',
          Creator: 'AfriBayit Certificate Engine v2',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const centerX = pageWidth / 2;

      // ═══════════════════════════════════════════
      // BACKGROUND — Subtle gradient overlay
      // ═══════════════════════════════════════════
      doc.rect(0, 0, pageWidth, pageHeight).fill('#FAFBFD');

      // ═══════════════════════════════════════════
      // OUTER BORDER — Navy thick border
      // ═══════════════════════════════════════════
      doc
        .lineWidth(4)
        .strokeColor(BRAND.navy)
        .rect(18, 18, pageWidth - 36, pageHeight - 36)
        .stroke();

      // ═══════════════════════════════════════════
      // INNER BORDER — Gold elegant border
      // ═══════════════════════════════════════════
      doc
        .lineWidth(1.5)
        .strokeColor(BRAND.gold)
        .rect(26, 26, pageWidth - 52, pageHeight - 52)
        .stroke();

      // ═══════════════════════════════════════════
      // DECORATIVE CORNERS — Gold accent corners
      // ═══════════════════════════════════════════
      drawCorner(doc, 30, 30, 20, BRAND.gold);
      drawCorner(doc, pageWidth - 30, 30, 20, BRAND.gold, true);
      drawCorner(doc, 30, pageHeight - 30, 20, BRAND.gold, false, true);
      drawCorner(doc, pageWidth - 30, pageHeight - 30, 20, BRAND.gold, true, true);

      // ═══════════════════════════════════════════
      // TOP ACCENT LINE — Gold horizontal line
      // ═══════════════════════════════════════════
      doc
        .moveTo(centerX - 200, 50)
        .lineTo(centerX + 200, 50)
        .lineWidth(2)
        .strokeColor(BRAND.gold)
        .stroke();

      // ═══════════════════════════════════════════
      // HEADER — AfriBayit branding
      // ═══════════════════════════════════════════
      doc
        .fontSize(18)
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .text('AFRIBAYIT', centerX, 58, { align: 'center' });

      doc
        .fontSize(10)
        .fillColor(BRAND.gold)
        .font('Helvetica')
        .text('ACADEMY', centerX, 78, { align: 'center' });

      doc
        .fontSize(7)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text('Plateforme Immobilière Pan-Africaine', centerX, 92, { align: 'center' });

      // Decorative line under header
      doc
        .moveTo(centerX - 100, 105)
        .lineTo(centerX + 100, 105)
        .lineWidth(0.5)
        .strokeColor(BRAND.gold)
        .stroke();

      // ═══════════════════════════════════════════
      // CERTIFICATE TITLE
      // ═══════════════════════════════════════════
      const titleFr = template.titleFr;
      const titleEn = template.titleEn;

      doc
        .fontSize(28)
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .text(titleFr, centerX, 118, { align: 'center' });

      doc
        .fontSize(11)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text(titleEn, centerX, 150, { align: 'center' });

      // ═══════════════════════════════════════════
      // MAIN CONTENT
      // ═══════════════════════════════════════════
      const contentY = 178;

      // "Ce certificat atteste que"
      doc
        .fontSize(10)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text('Ce certificat atteste que / This certifies that', centerX, contentY, { align: 'center' });

      // Recipient name — prominent display
      doc
        .fontSize(30)
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .text(data.recipientName, centerX, contentY + 22, { align: 'center' });

      // Gold underline under name
      const nameWidth = doc.widthOfString(data.recipientName);
      const lineHalf = Math.min(nameWidth / 2, 180);
      doc
        .moveTo(centerX - lineHalf, contentY + 58)
        .lineTo(centerX + lineHalf, contentY + 58)
        .lineWidth(1.5)
        .strokeColor(BRAND.gold)
        .stroke();

      // "a réussi avec succès"
      doc
        .fontSize(10)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text('a réussi avec succès le cours / has successfully completed the course', centerX, contentY + 68, { align: 'center' });

      // Course name — italic display
      doc
        .fontSize(20)
        .fillColor(BRAND.gold)
        .font('Helvetica-BoldOblique')
        .text(`« ${data.courseName} »`, centerX, contentY + 88, { align: 'center' });

      // "Sous la direction de"
      doc
        .fontSize(10)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text('Sous la direction de / Under the instruction of', centerX, contentY + 118, { align: 'center' });

      // Instructor name
      doc
        .fontSize(14)
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .text(data.instructorName, centerX, contentY + 135, { align: 'center' });

      // ═══════════════════════════════════════════
      // FOOTER AREA
      // ═══════════════════════════════════════════
      const footerY = pageHeight - 100;

      // Date and ID — left side
      doc
        .fontSize(9)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text(`Délivré le / Issued on: ${data.date}`, 70, footerY);

      doc
        .fontSize(8)
        .fillColor('#aaaaaa')
        .font('Helvetica')
        .text(`ID: ${data.certificateId}`, 70, footerY + 16);

      doc
        .fontSize(7)
        .fillColor('#aaaaaa')
        .font('Helvetica')
        .text(`Vérifiez: ${data.verificationUrl}`, 70, footerY + 30);

      // ═══════════════════════════════════════════
      // QR CODE — Right side
      // ═══════════════════════════════════════════
      doc.image(qrBuffer, pageWidth - 140, footerY - 20, { width: 65, height: 65 });

      doc
        .fontSize(7)
        .fillColor(BRAND.midGray)
        .font('Helvetica')
        .text('Scannez pour vérifier /', pageWidth - 148, footerY + 50)
        .text('Scan to verify', pageWidth - 148, footerY + 60);

      // ═══════════════════════════════════════════
      // SEAL — AfriBayit official seal
      // ═══════════════════════════════════════════
      const sealX = centerX;
      const sealY = footerY - 5;

      // Outer circle
      doc
        .circle(sealX, sealY + 15, 26)
        .lineWidth(2)
        .strokeColor(BRAND.gold)
        .stroke();

      // Inner circle
      doc
        .circle(sealX, sealY + 15, 20)
        .lineWidth(0.5)
        .strokeColor(BRAND.navy)
        .stroke();

      // Seal text
      doc
        .fontSize(10)
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .text('AFRI', sealX, sealY + 4, { align: 'center', width: 52 });
      doc
        .fontSize(7)
        .fillColor(BRAND.gold)
        .font('Helvetica-Bold')
        .text('BAYIT', sealX, sealY + 16, { align: 'center', width: 52 });

      // ═══════════════════════════════════════════
      // BOTTOM FOOTER — Legal text
      // ═══════════════════════════════════════════
      doc
        .fontSize(6.5)
        .fillColor('#bbbbbb')
        .font('Helvetica')
        .text('Délivré par AfriBayit Academy — Plateforme Immobilière Pan-Africaine', centerX, pageHeight - 38, { align: 'center' });

      doc
        .fontSize(6)
        .fillColor('#cccccc')
        .font('Helvetica')
        .text(`Ce certificat est vérifiable en ligne à l'adresse ${data.verificationUrl}`, centerX, pageHeight - 30, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Dessine un coin décoratif élégant
 */
function drawCorner(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  size: number,
  color: string,
  flipX = false,
  flipY = false
) {
  const dx = flipX ? -1 : 1;
  const dy = flipY ? 1 : -1;

  // Outer corner line
  doc
    .lineWidth(2)
    .strokeColor(color)
    .moveTo(x, y + dy * size)
    .lineTo(x, y)
    .lineTo(x + dx * size, y)
    .stroke();

  // Inner decorative dot
  doc
    .circle(x + dx * 3, y + dy * 3, 1.5)
    .fillColor(color)
    .fill();
}

/**
 * Génère un PDF de certificat et retourne le base64
 */
export async function generateCertificateBase64(
  data: CertificateData
): Promise<string> {
  const buffer = await generateCertificatePDF(data);
  return buffer.toString('base64');
}

/**
 * Génère l'URL de vérification AfriBayit pour un certificat
 */
export function buildVerificationUrl(certificateId: string): string {
  return `https://afribayit.com/certificates/verify/${certificateId}`;
}
