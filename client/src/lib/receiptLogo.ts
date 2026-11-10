import type jsPDF from "jspdf";

const LOGO_URL = "/images/helpghar-logo.jpeg";

let cachedLogo: Promise<string | null> | null = null;

/**
 * Loads the HelpGhar logo and turns it into a round badge (white ring + circular crop)
 * as a PNG data URL, ready for jsPDF. Returns null if the image can't be loaded,
 * so the receipt still downloads without it.
 */
function loadRoundLogo(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;

  cachedLogo = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 512;
      const ring = 24;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      // White ring
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Logo clipped to a circle inside the ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - ring, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, ring, ring, size - ring * 2, size - ring * 2);
      ctx.restore();

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      cachedLogo = null; // allow retry next time
      resolve(null);
    };
    img.src = LOGO_URL;
  });

  return cachedLogo;
}

/** Header layout shared by all receipts. */
export const RECEIPT_LOGO = { x: 12, y: 6, size: 26 };
/** Where the "HelpGhar" title starts when the logo is present. */
export const RECEIPT_TITLE_X = RECEIPT_LOGO.x + RECEIPT_LOGO.size + 7;

/** Draws the round logo in the receipt header. Returns true if it was drawn. */
export async function addReceiptLogo(doc: jsPDF): Promise<boolean> {
  const logo = await loadRoundLogo();
  if (!logo) return false;
  const { x, y, size } = RECEIPT_LOGO;
  doc.addImage(logo, "PNG", x, y, size, size);
  return true;
}
