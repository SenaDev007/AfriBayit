// AfriBayit Certificate PDF Generator — pdfkit + QR code

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

/**
 * Génère un PDF de certificat et retourne le buffer
 */
export async function generateCertificatePDF(
  data: CertificateData
): Promise<Buffer> {
  const template = getTemplate(data.type);

  return new Promise(async (resolve, reject) => {
    try {
      // Générer le QR code
      const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        width: 120,
        margin: 1,
        color: { dark: template.primaryColor, light: '#ffffff' },
      });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrBuffer = Buffer.from(qrBase64, 'base64');

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ---- Bordure décorative ----
      // Bordure extérieure
      doc
        .lineWidth(3)
        .strokeColor(template.primaryColor)
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .stroke();

      // Bordure intérieure dorée
      doc
        .lineWidth(1)
        .strokeColor(template.secondaryColor)
        .rect(28, 28, pageWidth - 56, pageHeight - 56)
        .stroke();

      // Coins décoratifs
      drawCorner(doc, 30, 30, 15, template.secondaryColor);
      drawCorner(doc, pageWidth - 30, 30, 15, template.secondaryColor, true);
      drawCorner(doc, 30, pageHeight - 30, 15, template.secondaryColor, false, true);
      drawCorner(doc, pageWidth - 30, pageHeight - 30, 15, template.secondaryColor, true, true);

      // ---- En-tête ----
      const centerX = pageWidth / 2;

      // Logo placeholder (texte)
      doc
        .fontSize(14)
        .fillColor(template.primaryColor)
        .font('Helvetica-Bold')
        .text('AFRIBAYIT', centerX, 55, { align: 'center' });

      doc
        .fontSize(8)
        .fillColor(template.secondaryColor)
        .font('Helvetica')
        .text('ACADEMY', centerX, 72, { align: 'center' });

      // Ligne décorative sous le logo
      doc
        .moveTo(centerX - 80, 85)
        .lineTo(centerX + 80, 85)
        .lineWidth(1)
        .strokeColor(template.secondaryColor)
        .stroke();

      // ---- Titre du certificat ----
      const titleFr = template.titleFr;
      const titleEn = template.titleEn;

      doc
        .fontSize(26)
        .fillColor(template.primaryColor)
        .font('Helvetica-Bold')
        .text(titleFr, centerX, 100, { align: 'center' });

      doc
        .fontSize(11)
        .fillColor('#666666')
        .font('Helvetica')
        .text(titleEn, centerX, 130, { align: 'center' });

      // ---- Texte principal ----
      const contentY = 165;

      // Sous-titre
      doc
        .fontSize(10)
        .fillColor('#888888')
        .font('Helvetica')
        .text('Ce certificat atteste que / This certifies that', centerX, contentY, { align: 'center' });

      // Nom du récipiendaire
      doc
        .fontSize(28)
        .fillColor(template.primaryColor)
        .font('Helvetica-Bold')
        .text(data.recipientName, centerX, contentY + 22, { align: 'center' });

      // Ligne sous le nom
      const nameWidth = doc.widthOfString(data.recipientName, { fontSize: 28 });
      doc
        .moveTo(centerX - Math.min(nameWidth / 2, 150), contentY + 56)
        .lineTo(centerX + Math.min(nameWidth / 2, 150), contentY + 56)
        .lineWidth(1)
        .strokeColor(template.secondaryColor)
        .stroke();

      // Texte "a réussi avec succès"
      doc
        .fontSize(10)
        .fillColor('#888888')
        .font('Helvetica')
        .text('a réussi avec succès le cours / has successfully completed the course', centerX, contentY + 65, { align: 'center' });

      // Nom du cours
      doc
        .fontSize(18)
        .fillColor(template.secondaryColor)
        .font('Helvetica-BoldOblique')
        .text(`"${data.courseName}"`, centerX, contentY + 85, { align: 'center' });

      // Sous le cours — "Sous la direction de"
      doc
        .fontSize(10)
        .fillColor('#888888')
        .font('Helvetica')
        .text(`Sous la direction de / Under the instruction of`, centerX, contentY + 115, { align: 'center' });

      doc
        .fontSize(13)
        .fillColor(template.primaryColor)
        .font('Helvetica-Bold')
        .text(data.instructorName, centerX, contentY + 132, { align: 'center' });

      // ---- Date et ID ----
      const footerY = pageHeight - 90;

      doc
        .fontSize(9)
        .fillColor('#888888')
        .font('Helvetica')
        .text(`Délivré le / Issued on: ${data.date}`, 80, footerY);

      doc
        .fontSize(8)
        .fillColor('#aaaaaa')
        .font('Helvetica')
        .text(`ID: ${data.certificateId}`, 80, footerY + 16);

      // ---- QR Code ----
      doc.image(qrBuffer, pageWidth - 140, footerY - 15, { width: 60, height: 60 });

      doc
        .fontSize(7)
        .fillColor('#aaaaaa')
        .font('Helvetica')
        .text('Vérifiez ce certificat /', pageWidth - 145, footerY + 50)
        .text('Verify this certificate', pageWidth - 145, footerY + 60);

      // ---- Sceau AfriBayit ----
      const sealX = centerX;
      const sealY = footerY - 5;

      // Cercle du sceau
      doc
        .circle(sealX, sealY + 15, 22)
        .lineWidth(1.5)
        .strokeColor(template.secondaryColor)
        .stroke();

      doc
        .fontSize(8)
        .fillColor(template.primaryColor)
        .font('Helvetica-Bold')
        .text('AFRI', sealX, sealY + 6, { align: 'center', width: 44 });
      doc
        .fontSize(6)
        .fillColor(template.secondaryColor)
        .font('Helvetica')
        .text('BAYIT', sealX, sealY + 17, { align: 'center', width: 44 });

      // ---- Footer ----
      doc
        .fontSize(7)
        .fillColor('#cccccc')
        .font('Helvetica')
        .text('Délivré par AfriBayit Academy — Plateforme Immobilière Pan-Africaine', centerX, pageHeight - 35, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Dessine un coin décoratif
 */
function drawCorner(
  doc: PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string,
  flipX = false,
  flipY = false
) {
  const dx = flipX ? -1 : 1;
  const dy = flipY ? 1 : -1;

  doc
    .lineWidth(1.5)
    .strokeColor(color)
    .moveTo(x, y + dy * size)
    .lineTo(x, y)
    .lineTo(x + dx * size, y)
    .stroke();
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
