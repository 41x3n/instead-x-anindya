import { readFileSync, writeFileSync } from "node:fs";
import type { AnnotationDoc } from "./types";
import { renderForm } from "./render";

// CLI: tsx src/cli.ts <annotation.json> <data.json> <form.pdf> <out.pdf>
const [annPath, dataPath, pdfPath, outPath] = process.argv.slice(2);
if (!annPath || !dataPath || !pdfPath || !outPath) {
  console.error("Usage: npm run render -- <annotation.json> <data.json> <form.pdf> <out.pdf>");
  process.exit(1);
}

const annotation = JSON.parse(readFileSync(annPath, "utf8")) as AnnotationDoc;
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const pdfBytes = new Uint8Array(readFileSync(pdfPath));
const out = await renderForm({ annotation, data, pdfBytes });
writeFileSync(outPath, out);
console.log(`Wrote ${outPath}`);
