import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MARGIN = 50;
const PAGE_W = 595;
const PAGE_H = 842;
const LINE = 14;

function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    if (!para) { out.push(""); continue; }
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (line) out.push(line);
        line = w;
      } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

class Writer {
  doc: PDFDocument;
  page: any;
  y: number;
  regular: any;
  bold: any;
  constructor(doc: PDFDocument, regular: any, bold: any) {
    this.doc = doc; this.regular = regular; this.bold = bold;
    this.page = doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }
  ensure(h: number) {
    if (this.y - h < MARGIN) {
      this.page = this.doc.addPage([PAGE_W, PAGE_H]);
      this.y = PAGE_H - MARGIN;
    }
  }
  heading(text: string, size = 14) {
    this.ensure(size + 8);
    this.page.drawText(text, { x: MARGIN, y: this.y - size, size, font: this.bold, color: rgb(0.1, 0.1, 0.15) });
    this.y -= size + 8;
  }
  para(text: string, size = 10) {
    const lines = wrap(text ?? "", this.regular, size, PAGE_W - MARGIN * 2);
    for (const line of lines) {
      this.ensure(LINE);
      this.page.drawText(line, { x: MARGIN, y: this.y - size, size, font: this.regular, color: rgb(0.2, 0.2, 0.25) });
      this.y -= LINE;
    }
    this.y -= 4;
  }
  spacer(h = 8) { this.y -= h; }
}

export async function renderProposalPdf(version: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, regular, bold);
  const p = version.proposal ?? {};

  w.heading("PROPOSAL", 22);
  w.para(p.title ?? "Untitled");
  w.spacer();
  w.para(`Client: ${p.client?.company ?? "—"}`);
  if (p.client?.contact_person) w.para(`Contact: ${p.client.contact_person}`);
  w.para(`Version: ${version.version}    Date: ${new Date().toLocaleDateString()}`);
  if (p.valid_until) w.para(`Valid until: ${p.valid_until}`);
  if (p.total_amount != null) w.para(`Total: ${p.currency ?? "USD"} ${Number(p.total_amount).toLocaleString()}`);
  w.spacer(12);

  const sections: Array<[string, string | null]> = [
    ["Executive Summary", version.executive_summary ?? p.summary],
    ["Scope of Work", version.scope_of_work],
    ["Deliverables", version.deliverables],
    ["Timeline", version.timeline],
    ["Pricing", version.pricing],
    ["Terms & Conditions", version.terms],
  ];
  for (const [h, body] of sections) {
    if (!body) continue;
    w.heading(h);
    w.para(body);
    w.spacer();
  }

  return await doc.save();
}

export async function renderContractPdf(contract: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, regular, bold);

  w.heading("CONTRACT", 22);
  w.para(contract.title ?? "Untitled");
  w.spacer();
  w.para(`Client: ${contract.client?.company ?? "—"}`);
  if (contract.client?.contact_person) w.para(`Contact: ${contract.client.contact_person}`);
  w.para(`Status: ${contract.status}    Date: ${new Date().toLocaleDateString()}`);
  if (contract.effective_date) w.para(`Effective: ${contract.effective_date}`);
  if (contract.end_date) w.para(`End: ${contract.end_date}`);
  if (contract.total_amount != null) w.para(`Total: ${contract.currency ?? "USD"} ${Number(contract.total_amount).toLocaleString()}`);
  w.spacer(12);

  const sections: Array<[string, string | null]> = [
    ["Parties", contract.parties],
    ["Scope of Work", contract.scope],
    ["Deliverables", contract.deliverables],
    ["Payment Terms", contract.payment_terms],
    ["Confidentiality", contract.confidentiality],
    ["Termination", contract.termination],
  ];
  for (const [h, body] of sections) {
    if (!body) continue;
    w.heading(h);
    w.para(body);
    w.spacer();
  }

  return await doc.save();
}
