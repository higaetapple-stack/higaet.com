import QRCode from "qrcode";

export const VERIFY_BASE_URL =
  process.env.APP_VERIFY_BASE_URL ?? "https://higaet-core-engine.lovable.app";

export function buildVerifyUrl(token: string): string {
  return `${VERIFY_BASE_URL.replace(/\/$/, "")}/verify/${token}`;
}

/** Generate a PNG (Uint8Array) QR code that encodes the verification URL. */
export async function generateQrPng(token: string): Promise<Uint8Array> {
  const url = buildVerifyUrl(token);
  const buf = await QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0b1220", light: "#ffffff" },
  });
  return new Uint8Array(buf);
}
