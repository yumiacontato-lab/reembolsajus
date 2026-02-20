import * as pdfjs from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import type { ReviewItem, ReviewItemStatus } from "@/lib/report-session";

type ProgressCallback = (message: string, progress: number) => void;

const FULL_DATE_REGEX = /(\d{2}[\/.-]\d{2}[\/.-]\d{2,4})/;
const SHORT_DATE_REGEX = /(\d{2}[\/.-]\d{2})(?![\/.-]\d)/;
const VALUE_REGEX_GLOBAL = /(?:R\$\s*)?-?\d{1,3}(?:[.\s]\d{3})*,\d{2}|(?:R\$\s*)?-?\d+[.,]\d{2}/g;
const HEADER_MARKERS = ["DATA", "DESCR", "HISTOR", "SALDO", "LANCAMENTO", "LANÇAMENTO"];

const reimbursableKeywords = [
  "UBER",
  "99",
  "TAXI",
  "CARTORIO",
  "GRU",
  "ESTAC",
  "ESTACIONAMENTO",
  "PEDAGIO",
  "SEDEX",
  "CORREIOS",
  "HOTEL",
  "HOSPEDAGEM",
  "PASSAGEM",
  "AEREA",
  "AZUL",
  "LATAM",
  "GOL",
];

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const normalizeDate = (rawDate: string): string => {
  const normalized = rawDate.replace(/[.-]/g, "/");
  const [day, month, yearRaw] = normalized.split("/");
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const normalizeDateWithFallbackYear = (rawDate: string): string => {
  const normalized = rawDate.replace(/[.-]/g, "/");
  const parts = normalized.split("/");

  if (parts.length === 2) {
    const [day, month] = parts;
    const year = String(new Date().getFullYear());
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return normalizeDate(rawDate);
};

const parseCurrencyValue = (rawValue: string): number => {
  const cleaned = rawValue.replace("R$", "").replace(/\s/g, "").trim();
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
};

const classifyTag = (description: string): { tag: string; status: ReviewItemStatus } => {
  const upper = description.toUpperCase();

  if (upper.includes("UBER") || upper.includes("99") || upper.includes("TAXI")) {
    return { tag: "TRANSPORTE", status: "reimbursable" };
  }

  if (upper.includes("CARTORIO")) {
    return { tag: "CARTORIO", status: "reimbursable" };
  }

  if (upper.includes("GRU")) {
    return { tag: "GRU", status: "reimbursable" };
  }

  if (upper.includes("ESTAC") || upper.includes("ESTACIONAMENTO")) {
    return { tag: "ESTACIONAMENTO", status: "reimbursable" };
  }

  if (upper.includes("POSTO") || upper.includes("COMBUST")) {
    return { tag: "COMBUSTIVEL", status: "possible" };
  }

  if (upper.includes("OAB")) {
    return { tag: "OAB", status: "possible" };
  }

  const isLikelyReimbursable = reimbursableKeywords.some((keyword) => upper.includes(keyword));
  return {
    tag: isLikelyReimbursable ? "REEMBOLSAVEL" : "REVISAR",
    status: isLikelyReimbursable ? "reimbursable" : "possible",
  };
};

const isLikelyHeaderLine = (line: string): boolean => {
  const upper = line.toUpperCase();
  return HEADER_MARKERS.some((marker) => upper.includes(marker));
};

const extractDateFromLine = (line: string): { rawDate: string; normalizedDate: string } | null => {
  const fullDateMatch = line.match(FULL_DATE_REGEX);
  if (fullDateMatch) {
    return {
      rawDate: fullDateMatch[1],
      normalizedDate: normalizeDateWithFallbackYear(fullDateMatch[1]),
    };
  }

  const shortDateMatch = line.match(SHORT_DATE_REGEX);
  if (shortDateMatch) {
    return {
      rawDate: shortDateMatch[1],
      normalizedDate: normalizeDateWithFallbackYear(shortDateMatch[1]),
    };
  }

  return null;
};

const extractValueCandidates = (line: string): string[] => {
  return Array.from(line.matchAll(VALUE_REGEX_GLOBAL)).map((match) => match[0]);
};

const parseLineToItem = (line: string): ReviewItem | null => {
  const compactLine = line.replace(/\s+/g, " ").trim();
  if (!compactLine || compactLine.length < 6 || isLikelyHeaderLine(compactLine)) {
    return null;
  }

  const dateData = extractDateFromLine(compactLine);
  if (!dateData) {
    return null;
  }

  const valueCandidates = extractValueCandidates(compactLine);
  if (valueCandidates.length === 0) {
    return null;
  }

  const dateRaw = dateData.rawDate;
  const valueRaw = valueCandidates[0];

  const dateIndex = compactLine.indexOf(dateRaw);
  const valueIndex = compactLine.indexOf(valueRaw, dateIndex + dateRaw.length);

  if (valueIndex <= dateIndex) {
    return null;
  }

  const description = compactLine
    .slice(dateIndex + dateRaw.length, valueIndex)
    .replace(/^[\s-–—]+|[\s-–—]+$/g, "")
    .trim();

  const value = parseCurrencyValue(valueRaw);

  if (!description || value <= 0) {
    return null;
  }

  const { tag, status } = classifyTag(description);

  return {
    id: crypto.randomUUID(),
    date: dateData.normalizedDate,
    description,
    value,
    tag,
    status,
    client: "",
  };
};

const parseItemsFromLineCombinations = (text: string): ReviewItem[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ReviewItem[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] ?? "";

    const direct = parseLineToItem(line);
    if (direct) {
      parsed.push(direct);
      continue;
    }

    const combined = parseLineToItem(`${line} ${nextLine}`);
    if (combined) {
      parsed.push(combined);
    }
  }

  return parsed;
};

const deduplicateItems = (items: ReviewItem[]): ReviewItem[] => {
  const seen = new Set<string>();
  const unique: ReviewItem[] = [];

  for (const item of items) {
    const signature = `${item.date}|${item.description.toUpperCase()}|${item.value.toFixed(2)}`;
    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    unique.push(item);
  }

  return unique;
};

const extractTextWithPdfJs = async (file: File, onProgress?: ProgressCallback): Promise<string> => {
  onProgress?.("Lendo texto interno do PDF...", 20);
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;

  const pageTexts: string[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const lineChunks: string[] = [];
    let currentLine = "";

    for (const item of textContent.items) {
      if (!("str" in item)) {
        continue;
      }

      currentLine += `${item.str} `;

      if ("hasEOL" in item && item.hasEOL) {
        lineChunks.push(currentLine.trim());
        currentLine = "";
      }
    }

    if (currentLine.trim()) {
      lineChunks.push(currentLine.trim());
    }

    const pageText = lineChunks.join("\n");

    pageTexts.push(pageText);

    const ratio = pageIndex / pdf.numPages;
    onProgress?.("Analisando conteúdo textual...", 20 + Math.round(ratio * 35));
  }

  return pageTexts.join("\n");
};

const extractTextWithOcr = async (file: File, onProgress?: ProgressCallback): Promise<string> => {
  onProgress?.("Executando OCR nas páginas...", 60);

  const worker = await createWorker("por+eng", 1, {
    logger: (msg) => {
      if (msg.status === "recognizing text") {
        onProgress?.("Reconhecendo texto via OCR...", 60 + Math.round(msg.progress * 35));
      }
    },
  });

  try {
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pagesToProcess = Math.min(pdf.numPages, 5);
    const chunks: string[] = [];

    for (let pageIndex = 1; pageIndex <= pagesToProcess; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        continue;
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      const { data: ocrData } = await worker.recognize(canvas);
      chunks.push(ocrData.text);

      const ratio = pageIndex / pagesToProcess;
      onProgress?.("Processando OCR por página...", 60 + Math.round(ratio * 35));
    }

    return chunks.join("\n");
  } finally {
    await worker.terminate();
  }
};

export const extractItemsFromPdf = async (
  file: File,
  onProgress?: ProgressCallback,
): Promise<ReviewItem[]> => {
  const textFromPdf = await extractTextWithPdfJs(file, onProgress);
  let candidateText = textFromPdf;

  const preliminaryItems = parseItemsFromLineCombinations(candidateText);

  if (preliminaryItems.length === 0) {
    const textFromOcr = await extractTextWithOcr(file, onProgress);
    candidateText = `${candidateText}\n${textFromOcr}`;
  }

  const parsedItems = parseItemsFromLineCombinations(candidateText);

  onProgress?.("Finalizando análise...", 100);

  return deduplicateItems(parsedItems);
};