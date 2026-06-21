import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateQrPng, buildVerifyUrl } from "./qr.server";

export interface CertificatePdfInput {
  studentName: string;
  programTitle: string;
  certificateNumber: string;
  verificationToken: string;
  issuedAt: string | Date;
  programCategory?: string | null;
}

const W = 842; // A4 landscape
const H = 595;

export async function renderCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const ink = rgb(0.06, 0.09, 0.16);
  const muted = rgb(0.42, 0.45, 0.52);
  const academy = rgb(0.13, 0.36, 0.71);
  const gold = rgb(0.72, 0.55, 0.18);

  // Border frame
  page.drawRectangle({
    x: 24, y: 24, width: W - 48, height: H - 48,
    borderColor: academy, borderWidth: 1.5,
  });
  page.drawRectangle({
    x: 32, y: 32, width: W - 64, height: H - 64,
    borderColor: gold, borderWidth: 0.5,
  });

  // Brand strip
  const brand = "HIGAET ACADEMY";
  page.drawText(brand, {
    x: W / 2 - bold.widthOfTextAtSize(brand, 11) / 2,
    y: H - 70, size: 11, font: bold, color: academy,
  });
  const sub = "Helen Institute of Gen AI Engineering & Technology";
  page.drawText(sub, {
    x: W / 2 - regular.widthOfTextAtSize(sub, 9) / 2,
    y: H - 86, size: 9, font: regular, color: muted,
  });

  // Title
  const title = "Certificate of Completion";
  page.drawText(title, {
    x: W / 2 - bold.widthOfTextAtSize(title, 32) / 2,
    y: H - 150, size: 32, font: bold, color: ink,
  });

  // "is awarded to"
  const lead = "This is to certify that";
  page.drawText(lead, {
    x: W / 2 - italic.widthOfTextAtSize(lead, 12) / 2,
    y: H - 195, size: 12, font: italic, color: muted,
  });

  // Student name
  const name = input.studentName || "Student";
  const nameSize = 30;
  page.drawText(name, {
    x: W / 2 - bold.widthOfTextAtSize(name, nameSize) / 2,
    y: H - 245, size: nameSize, font: bold, color: ink,
  });
  // underline
  const nameW = bold.widthOfTextAtSize(name, nameSize);
  page.drawLine({
    start: { x: W / 2 - nameW / 2 - 10, y: H - 255 },
    end: { x: W / 2 + nameW / 2 + 10, y: H - 255 },
    color: gold, thickness: 0.75,
  });

  // Program clause
  const clause = "has successfully completed the program";
  page.drawText(clause, {
    x: W / 2 - regular.widthOfTextAtSize(clause, 12) / 2,
    y: H - 295, size: 12, font: regular, color: muted,
  });

  const program = input.programTitle || "Program";
  const progSize = 20;
  page.drawText(program, {
    x: W / 2 - bold.widthOfTextAtSize(program, progSize) / 2,
    y: H - 330, size: progSize, font: bold, color: academy,
  });

  if (input.programCategory) {
    page.drawText(input.programCategory, {
      x: W / 2 - regular.widthOfTextAtSize(input.programCategory, 10) / 2,
      y: H - 350, size: 10, font: regular, color: muted,
    });
  }

  // Footer meta row
  const issued = new Date(input.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const footY = 90;

  // Issued
  page.drawText("ISSUED", { x: 80, y: footY + 22, size: 8, font: bold, color: muted });
  page.drawText(issued, { x: 80, y: footY, size: 12, font: bold, color: ink });

  // Certificate Number (center)
  const certLabel = "CERTIFICATE NO.";
  page.drawText(certLabel, {
    x: W / 2 - bold.widthOfTextAtSize(certLabel, 8) / 2,
    y: footY + 22, size: 8, font: bold, color: muted,
  });
  page.drawText(input.certificateNumber, {
    x: W / 2 - bold.widthOfTextAtSize(input.certificateNumber, 12) / 2,
    y: footY, size: 12, font: bold, color: ink,
  });

  // Authorized signature (right)
  const sigX = W - 230;
  page.drawLine({
    start: { x: sigX, y: footY + 18 },
    end: { x: sigX + 150, y: footY + 18 },
    color: ink, thickness: 0.5,
  });
  page.drawText("Authorized Signatory", {
    x: sigX, y: footY + 4, size: 9, font: regular, color: muted,
  });
  page.drawText("HIGAET Academy", {
    x: sigX, y: footY - 8, size: 9, font: bold, color: ink,
  });

  // QR code (bottom-left of right side)
  const qrPng = await generateQrPng(input.verificationToken);
  const qrImg = await doc.embedPng(qrPng);
  const qrSize = 80;
  page.drawImage(qrImg, {
    x: W - 130, y: H - 160, width: qrSize, height: qrSize,
  });
  page.drawText("Scan to verify", {
    x: W - 130, y: H - 175, size: 7, font: regular, color: muted,
  });

  // Verify URL (small footer line)
  const verifyUrl = buildVerifyUrl(input.verificationToken);
  page.drawText(verifyUrl, {
    x: W / 2 - regular.widthOfTextAtSize(verifyUrl, 7) / 2,
    y: 50, size: 7, font: regular, color: muted,
  });

  const bytes = await doc.save();
  return bytes;
}
