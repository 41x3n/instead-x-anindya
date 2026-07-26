import "./styles.css";
import { renderForm } from "../../src/render";
import type { AnnotationDoc } from "../../src/types";
import ann1040 from "../../annotations/1040.annotation.json";
import annScheduleC from "../../annotations/scheduleC.annotation.json";
import data1040 from "../../examples/1040.data.json";
import dataScheduleC from "../../examples/scheduleC.data.json";

interface FormDef {
  label: string;
  hint: string;
  pdf: string;
  annotation: AnnotationDoc;
  data: unknown;
}

const FORMS: Record<string, FormDef> = {
  "1040": {
    label: "Form 1040",
    hint: "Name, segmented SSN, filing-status checkbox, and right-aligned income lines.",
    pdf: "f1040.pdf",
    annotation: ann1040 as AnnotationDoc,
    data: data1040,
  },
  scheduleC: {
    label: "Schedule C",
    hint: "Business details plus Part V's repeating 'Other expenses' rows (edit the array).",
    pdf: "f1040sc.pdf",
    annotation: annScheduleC as AnnotationDoc,
    data: dataScheduleC,
  },
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const tabs = $<HTMLDivElement>("tabs");
const hint = $<HTMLParagraphElement>("hint");
const editor = $<HTMLTextAreaElement>("editor");
const frame = $<HTMLIFrameElement>("frame");
const errorEl = $<HTMLPreElement>("error");
const statusEl = $<HTMLSpanElement>("status");

let current = "1040";
let currentUrl: string | null = null;
const pdfCache = new Map<string, Uint8Array>();

async function loadPdf(name: string): Promise<Uint8Array> {
  const cached = pdfCache.get(name);
  if (cached) return cached;
  const res = await fetch(name);
  if (!res.ok) throw new Error(`Could not load ${name} (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  pdfCache.set(name, bytes);
  return bytes;
}

function showError(message: string): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
  statusEl.textContent = "";
}

async function render(): Promise<void> {
  const def = FORMS[current];
  errorEl.hidden = true;
  statusEl.textContent = "Rendering…";

  let data: unknown;
  try {
    data = JSON.parse(editor.value);
  } catch (e) {
    showError("Invalid JSON — " + (e as Error).message);
    return;
  }

  try {
    const pdfBytes = await loadPdf(def.pdf);
    const out = await renderForm({ annotation: def.annotation, data, pdfBytes });
    const blob = new Blob([out], { type: "application/pdf" });
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(blob);
    frame.src = currentUrl;
    statusEl.textContent = "Rendered ✓";
  } catch (e) {
    showError((e as Error).message);
  }
}

function selectForm(key: string): void {
  current = key;
  const def = FORMS[key];
  hint.textContent = def.hint;
  editor.value = JSON.stringify(def.data, null, 2);
  for (const btn of tabs.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.key === key);
  }
  void render();
}

function buildTabs(): void {
  for (const [key, def] of Object.entries(FORMS)) {
    const btn = document.createElement("button");
    btn.textContent = def.label;
    btn.dataset.key = key;
    btn.addEventListener("click", () => selectForm(key));
    tabs.appendChild(btn);
  }
}

$<HTMLButtonElement>("render").addEventListener("click", () => void render());

buildTabs();
selectForm("1040");
