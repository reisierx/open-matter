/**
 * Build the sample supply-agreement PDFs used by The Race and the quickstart.
 * Run: node scripts/generate-samples.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const INK = rgb(0.11, 0.09, 0.07);
const RULE = rgb(0.55, 0.48, 0.42);
const MUTED = rgb(0.38, 0.34, 0.3);
const RUBRIC = rgb(0.48, 0.18, 0.21);

function winansi(s) {
  return s
    .replaceAll("€", "EUR")
    .replaceAll("—", "--")
    .replaceAll("–", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("‘", "'")
    .replaceAll("’", "'");
}

const PAGES = [
  {
    folio: "1",
    heading: "Supply Agreement",
    body: [
      'This Supply Agreement (the "Agreement") is entered into on 4 March 2026',
      "between:",
      "",
      "REISIERX Lda, a private limited company organised under the laws of",
      "Portugal, with its registered office at Rua da Prata 140, 1100-415 Lisboa,",
      'corporate number 514 882 103 ("Supplier"); and',
      "",
      "Nortevale Comercio S.A., a public limited company organised under the laws",
      "of Portugal, with its registered office at Avenida dos Aliados 12, 4000-064",
      'Porto, corporate number 501 220 774 ("Buyer").',
      "",
      "Recitals. Buyer wishes to purchase finished goods from Supplier on the",
      "terms set out here. Supplier is willing to manufacture and deliver those",
      "goods. The parties agree as follows.",
      "",
      "1. Purpose. This Agreement governs the manufacture, sale, and delivery of",
      "the goods listed in Schedule A, and nothing else. Marketing materials,",
      "emails, and prior quotations do not form part of this contract.",
    ],
  },
  {
    folio: "2",
    heading: "2. Definitions  ·  Schedule A",
    body: [
      '"Goods" means the items in Schedule A, as updated by a written change',
      'order signed by both parties. "Business Day" means a day other than a',
      'Saturday, Sunday, or public holiday in Lisbon. "Confidential Information"',
      'has the meaning given in clause 9. "Liability Cap" has the meaning given',
      "in clause 7.",
      "",
      "Schedule A -- Products and list prices (EUR, ex-VAT)",
      "",
      "SKU          Description                         Unit     List",
      "RX-140       Archive folio, A4, 120 gsm          pack     18.00",
      "RX-141       Archive folio, A3, 120 gsm          pack     27.50",
      "RX-220       Cloth-bound minute book             each     42.00",
      "RX-331       Oxblood endpaper, 90 x 64           sheet     1.80",
      "RX-904       House ink, 250 ml                   bottle    9.40",
      "",
      "Prices are list prices on the date of this Agreement. Volume discounts",
      "in Schedule B apply from the second quarter of each contract year.",
    ],
  },
  {
    folio: "3",
    heading: "3. Supply and delivery",
    body: [
      "3.1 Supplier shall manufacture the Goods at its Lisbon workshop or at a",
      "subcontractor approved in writing by Buyer.",
      "",
      "3.2 Delivery is DAP Porto (Incoterms 2020) unless the order states EXW",
      "Lisbon. Title and risk pass on delivery.",
      "",
      "3.3 Lead time is twenty-one (21) Business Days from a firm purchase",
      "order, except for SKU RX-220, which is thirty-five (35) Business Days.",
      "",
      "3.4 Buyer shall inspect Goods within five (5) Business Days of delivery",
      "and notify Supplier of any visible defect. Failure to notify is deemed",
      "acceptance of visible condition, and does not waive latent-defect rights",
      "under clause 6.",
      "",
      "3.5 Force majeure. Neither party is liable for delay caused by events",
      "beyond its reasonable control, including war, epidemic, or failure of a",
      "sole-source mill, provided it gives notice within three Business Days.",
    ],
  },
  {
    folio: "4",
    heading: "7. Liability",
    body: [
      "7.1 Subject to clause 7.3, each party's total aggregate liability under",
      "or in connection with this Agreement, whether in contract, tort",
      "(including negligence), or otherwise, is limited to fifty thousand",
      'euros (EUR 50,000) (the "Liability Cap").',
      "",
      "7.2 Neither party is liable for indirect, incidental, special, or",
      "consequential loss, or for loss of profit, revenue, goodwill, or data,",
      "whether or not such loss was foreseeable.",
      "",
      "7.3 Nothing in this Agreement limits liability for death or personal",
      "injury caused by negligence, for fraud or fraudulent misrepresentation,",
      "or for any liability that cannot be limited under Portuguese law.",
      "",
      "7.4 The Liability Cap applies to the Agreement as a whole and is not",
      "multiplied by the number of claims, orders, or years. Insurance proceeds",
      "actually received reduce the remaining cap euro for euro.",
      "",
      "7.5 Buyer's exclusive remedy for non-conforming Goods is, at Supplier's",
      "election, repair, replacement, or refund of the price paid for the",
      "affected Goods.",
    ],
  },
  {
    folio: "5",
    heading: "8. Term and termination",
    body: [
      "8.1 This Agreement starts on the date first written above and continues",
      "for three (3) years, then renews for successive one-year terms unless",
      "either party gives written notice of non-renewal at least ninety (90)",
      "days before the then-current term ends.",
      "",
      "8.2 Either party may terminate for convenience on ninety (90) days'",
      "written notice after the first anniversary.",
      "",
      "8.3 Either party may terminate immediately by written notice if the",
      "other commits a material breach and does not cure it within thirty (30)",
      "days of notice describing the breach in reasonable detail.",
      "",
      "8.4 Either party may terminate immediately if the other becomes",
      "insolvent, enters into an arrangement with creditors, or has a receiver",
      "or liquidator appointed over a material part of its assets.",
      "",
      "8.5 On termination, open purchase orders survive unless Buyer cancels",
      "them in the termination notice and pays for work already started, at",
      "cost plus ten percent.",
    ],
  },
  {
    folio: "6",
    heading: "9. Confidentiality  ·  10. Intellectual property",
    body: [
      "9.1 Each party shall keep the other's Confidential Information secret",
      "and use it only to perform this Agreement. The duty lasts three (3)",
      "years after termination.",
      "",
      "9.2 Confidential Information does not include information that is",
      "public, independently developed, or disclosed under a legal duty, in",
      "which case the receiving party shall give prior notice if lawful.",
      "",
      "10.1 Supplier retains all intellectual property in the Goods, the",
      "workshop processes, and any tooling. Buyer receives a non-exclusive",
      "licence to use, sell, and display the Goods it has paid for.",
      "",
      "10.2 Buyer's trade marks appear on the Goods only where Schedule A says",
      "so. Supplier shall not register or challenge those marks.",
      "",
      "10.3 Custom tooling paid for by Buyer is Buyer's property. Supplier",
      "shall store it for twenty-four months after the last order and then",
      "return or destroy it on Buyer's written instruction.",
    ],
  },
  {
    folio: "7",
    heading: "11. Fees  ·  12. Governing law",
    body: [
      "11.1 Invoices are due thirty (30) days from the invoice date. Late",
      "sums accrue interest at the Portuguese statutory commercial rate.",
      "",
      "11.2 Schedule B -- Volume discount (trailing twelve months, EUR)",
      "",
      "Band          Spend from       Discount",
      "A             0                0 %",
      "B             25 000           4 %",
      "C             80 000           7 %",
      "D             160 000          11 %",
      "",
      "Discounts apply to list prices in Schedule A and are calculated each",
      "calendar quarter in arrears as a credit note.",
      "",
      "12.1 This Agreement is governed by the laws of Portugal. The courts of",
      "Lisbon have exclusive jurisdiction, except that either party may seek",
      "interim relief in any court of competent jurisdiction.",
      "",
      "12.2 If a provision is held unenforceable, the rest remains in force.",
      "This is the entire agreement. Amendments must be in writing and signed.",
    ],
  },
  {
    folio: "8",
    heading: "Signature",
    body: [
      "Signed by the parties' authorised representatives.",
      "",
      "For REISIERX Lda                              For Nortevale Comercio S.A.",
      "",
      "",
      "____________________________                   ____________________________",
      "Name:  Ines Vale                               Name:  Rui Mota",
      "Title: Managing director                       Title: Purchasing director",
      "Date:  4 March 2026                            Date:  4 March 2026",
      "",
      "",
      "Witness                                        Witness",
      "____________________________                   ____________________________",
      "",
      "This page is the last page of the Agreement. Schedules A and B appear",
      "in the body above and are not attached separately.",
    ],
  },
];

function yamlEscape(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[:#\n]|^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

function stringifyManifest(m) {
  return [
    `spec: ${m.spec}`,
    `title: ${yamlEscape(m.title)}`,
    `doc_type: ${m.doc_type}`,
    `language: ${m.language}`,
    `pages: ${m.pages}`,
    `summary: >`,
    `  ${m.summary}`,
    `key_sections:`,
    ...Object.entries(m.key_sections).map(([k, v]) => `  ${k}: ${v}`),
    `entities:`,
    ...m.entities.map((e) => `  - ${yamlEscape(e)}`),
    `extraction:`,
    `  scanned: ${m.extraction.scanned}`,
    `  tables_on_pages: [${m.extraction.tables_on_pages.join(", ")}]`,
    `content_sha256: ${m.content_sha256}`,
    `generated_by: ${m.generated_by}`,
    `generated_at: ${m.generated_at}`,
    "",
  ].join("\n");
}

async function buildPlain() {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 64;
  const extracted = [];

  for (const pageSpec of PAGES) {
    const page = pdf.addPage([pageW, pageH]);
    page.drawLine({
      start: { x: margin, y: pageH - 48 },
      end: { x: pageW - margin, y: pageH - 48 },
      thickness: 0.6,
      color: RULE,
    });
    page.drawText("REISIERX  ·  Nortevale", {
      x: margin,
      y: pageH - 40,
      size: 8,
      font: serif,
      color: MUTED,
    });
    page.drawText("Confidential", {
      x: pageW - margin - serif.widthOfTextAtSize("Confidential", 8),
      y: pageH - 40,
      size: 8,
      font: serifItalic,
      color: MUTED,
    });

    page.drawText(winansi(pageSpec.heading), {
      x: margin,
      y: pageH - 92,
      size: pageSpec.folio === "1" ? 22 : 14,
      font: serifBold,
      color: pageSpec.folio === "1" ? RUBRIC : INK,
    });

    let y = pageH - 128;
    const pageLines = [pageSpec.heading];
    for (const line of pageSpec.body) {
      if (!line) {
        y -= 10;
        pageLines.push("");
        continue;
      }
      page.drawText(winansi(line), { x: margin, y, size: 11, font: serif, color: INK });
      pageLines.push(line);
      y -= 16;
    }
    extracted.push(pageLines.join("\n").trimEnd());

    page.drawLine({
      start: { x: margin, y: 48 },
      end: { x: pageW - margin, y: 48 },
      thickness: 0.4,
      color: RULE,
    });
    page.drawText(`- ${pageSpec.folio} -`, {
      x: pageW / 2 - 10,
      y: 34,
      size: 9,
      font: serif,
      color: MUTED,
    });
  }

  pdf.setTitle("Supply Agreement - REISIERX Lda and Nortevale Comercio S.A.");
  pdf.setAuthor("REISIERX Lda");
  pdf.setCreator("open-matter sample factory");
  pdf.setLanguage("en");

  const text = extracted.join("\n\n").trim();
  const bytes = await pdf.save({ useObjectStreams: false });
  return { bytes, text };
}

async function main() {
  await mkdir("public/samples", { recursive: true });
  await mkdir("samples", { recursive: true });

  const { bytes: plain, text } = await buildPlain();
  const hash = createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);

  const manifest = {
    spec: "open-matter/0.1",
    title: "Supply agreement -- REISIERX Lda and Nortevale Comercio S.A.",
    doc_type: "contract",
    language: "en",
    pages: 8,
    summary:
      "Three-year supply of archival paper goods between REISIERX Lda (Lisbon) and Nortevale Comercio S.A. (Porto). Liability cap and termination terms are the sensitive clauses.",
    key_sections: {
      parties: 1,
      schedule_a: 2,
      delivery: 3,
      liability_cap: 4,
      termination: 5,
      confidentiality: 6,
      fees: 7,
      signatures: 8,
    },
    entities: ["REISIERX Lda", "Nortevale Comercio S.A.", "Ines Vale", "Rui Mota"],
    extraction: { scanned: false, tables_on_pages: [2, 7] },
    content_sha256: hash,
    generated_by: "open-matter-samples/0.1",
    generated_at: "2026-08-13",
  };

  const yaml = stringifyManifest(manifest);
  const pdf = await PDFDocument.load(plain);
  await pdf.attach(new TextEncoder().encode(yaml), "open-matter.yaml", {
    mimeType: "application/yaml",
    description: "open-matter/0.1 machine-readable index card",
    creationDate: new Date("2026-08-13"),
    modificationDate: new Date("2026-08-13"),
  });
  const enriched = await pdf.save({ useObjectStreams: false });

  await writeFile("public/samples/reisierx-supply-agreement.pdf", plain);
  await writeFile("public/samples/reisierx-supply-agreement.frontmatter.pdf", enriched);
  await writeFile("samples/reisierx-supply-agreement.pdf", plain);
  await writeFile("samples/reisierx-supply-agreement.frontmatter.pdf", enriched);
  await writeFile("samples/reisierx-supply-agreement.yaml", yaml);

  console.log("plain    ", plain.byteLength, "bytes,", text.length, "chars");
  console.log("enriched ", enriched.byteLength, "bytes");
  console.log("sha256   ", hash);
  console.log("tokens~  ", Math.ceil(text.length / 4), "vs", Math.ceil(yaml.length / 4));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
