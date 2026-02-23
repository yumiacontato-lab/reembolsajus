import * as pdfjs from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import type { ReviewItem, ReviewItemStatus } from "@/lib/report-session";
import {
  extractDateFromLine,
  isLikelyHeaderLine,
  isLikelyNonTransactionLine,
  parseCurrencyValue,
} from "@/lib/ocr-parser-utils";

type ProgressCallback = (message: string, progress: number) => void;
type DebugCallback = (payload: {
  textFromPdf: string;
  textFromOcr?: string;
  ocrError?: string;
  parsedCount: number;
  sample: string[];
}) => void;

const VALUE_REGEX_GLOBAL = /(?:R\$\s*)?-?\d{1,3}(?:[.\s]\d{3})*,\d{1,2}|(?:R\$\s*)?-?\d+[.,]\d{1,2}/g;

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

const extractValueCandidates = (line: string): string[] => {
  return Array.from(line.matchAll(VALUE_REGEX_GLOBAL)).map((match) => match[0]);
};

const MAX_REASONABLE_VALUE = 1_000_000;

const selectBestValueCandidate = (
  compactLine: string,
  valueCandidates: string[],
  dateStartIndex: number,
  dateLength: number,
): { raw: string; index: number; value: number } | null => {
  const dateEndIndex = dateStartIndex + dateLength;

  const candidates = valueCandidates
    .map((raw) => {
      const index = compactLine.indexOf(raw, dateEndIndex);
      const value = parseCurrencyValue(raw);
      const hasTwoDecimalPlaces = /[.,]\d{2}$/.test(raw);

      return { raw, index, value, hasTwoDecimalPlaces };
    })
    .filter((candidate) => {
      return (
        candidate.index > dateStartIndex &&
        candidate.value > 0 &&
        candidate.value <= MAX_REASONABLE_VALUE
      );
    })
    .sort((a, b) => {
      if (a.hasTwoDecimalPlaces !== b.hasTwoDecimalPlaces) {
        return a.hasTwoDecimalPlaces ? -1 : 1;
      }

      return b.index - a.index;
    });

  if (candidates.length === 0) {
    return null;
  }

  const { raw, index, value } = candidates[0];
  return { raw, index, value };
};

const isLikelyNoiseDescription = (description: string): boolean => {
  const trimmed = description.trim();
  if (trimmed.length < 3) {
    return true;
  }

  const letters = (trimmed.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length;
  const digits = (trimmed.match(/\d/g) ?? []).length;
  const uuidLike = /^[a-f0-9]{8,}(?:-[a-f0-9]{4,})+$/i.test(trimmed);

  if (uuidLike) {
    return true;
  }

  if (letters === 0) {
    return true;
  }

  const mostlyNumericSingleToken = !trimmed.includes(" ") && digits > letters * 2;
  if (mostlyNumericSingleToken) {
    return true;
  }

  return false;
};

const parseLineToItem = (line: string): ReviewItem | null => {
  const compactLine = line.replace(/\s+/g, " ").trim();
  if (
    !compactLine ||
    compactLine.length < 6 ||
    isLikelyHeaderLine(compactLine) ||
    isLikelyNonTransactionLine(compactLine)
  ) {
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
  const dateIndex = compactLine.indexOf(dateRaw);
  const selectedValue = selectBestValueCandidate(
    compactLine,
    valueCandidates,
    dateIndex,
    dateRaw.length,
  );

  if (!selectedValue) {
    return null;
  }

  const { raw: valueRaw, index: valueIndex, value } = selectedValue;

  if (valueIndex <= dateIndex) {
    return null;
  }

  const description = compactLine
    .slice(dateIndex + dateRaw.length, valueIndex)
    .replace(/^[\s-–—]+|[\s-–—]+$/g, "")
    .trim();

  if (!description || value <= 0 || isLikelyNoiseDescription(description)) {
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
    const previousLine = lines[index - 1] ?? "";
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
      continue;
    }

    const combinedWithPrevious = parseLineToItem(`${previousLine} ${line}`);
    if (combinedWithPrevious) {
      parsed.push(combinedWithPrevious);
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
  if (typeof document === "undefined") {
    return "";
  }

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

      await page.render({ canvasContext: context, viewport, canvas }).promise;
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
  onDebug?: DebugCallback,
): Promise<ReviewItem[]> => {
  let textFromPdf = "";
  let ocrError: string | undefined;

  try {
    textFromPdf = await extractTextWithPdfJs(file, onProgress);
  } catch {
    onProgress?.("Leitura textual indisponível, tentando OCR...", 55);
  }

  let candidateText = textFromPdf;
  let textFromOcr: string | undefined;

  const preliminaryItems = parseItemsFromLineCombinations(candidateText);
  const shouldRunOcr = preliminaryItems.length === 0 || candidateText.trim().length < 120;

  if (shouldRunOcr) {
    try {
      textFromOcr = await extractTextWithOcr(file, onProgress);
      candidateText = `${candidateText}\n${textFromOcr}`;
    } catch (error) {
      ocrError = error instanceof Error ? error.message : "unknown_error";
    }
  }

  const parsedItems = parseItemsFromLineCombinations(candidateText);

  onProgress?.("Finalizando análise...", 100);

  onDebug?.({
    textFromPdf,
    textFromOcr,
    ocrError,
    parsedCount: parsedItems.length,
    sample: candidateText.split(/\r?\n/).filter(Boolean).slice(0, 30),
  });

  return deduplicateItems(parsedItems);
};
