const FULL_DATE_REGEX = /(\d{2}[/.-]\d{2}[/.-]\d{2,4})/;
const SHORT_DATE_REGEX = /(\d{2}[/.-]\d{2})(?![/.-]\d)/;
const HEADER_MARKERS = ["DATA", "DESCR", "HISTOR", "SALDO", "LANCAMENTO", "LANÇAMENTO"];
const NON_TRANSACTION_MARKERS = [
  "SALDO ANTERIOR",
  "SALDO FINAL",
  "SALDO DO DIA",
  "TOTAL DE ENTRADAS",
  "TOTAL DE SAIDAS",
  "TOTAL DE SAÍDAS",
];

export const normalizeForMatch = (value) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

export const normalizeDate = (rawDate) => {
  const normalized = rawDate.replace(/[.-]/g, "/");
  const [day, month, yearRaw] = normalized.split("/");
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export const normalizeDateWithFallbackYear = (rawDate) => {
  const normalized = rawDate.replace(/[.-]/g, "/");
  const parts = normalized.split("/");

  if (parts.length === 2) {
    const [day, month] = parts;
    const today = new Date();
    const inferredDate = new Date(today.getFullYear(), Number(month) - 1, Number(day));
    const inferredYear =
      inferredDate.getTime() > today.getTime() + 24 * 60 * 60 * 1000
        ? today.getFullYear() - 1
        : today.getFullYear();

    return `${String(inferredYear)}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return normalizeDate(rawDate);
};

export const parseCurrencyValue = (rawValue) => {
  const cleaned = rawValue
    .normalize("NFKC")
    .replace(/[Rr]\s*\$/g, "")
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "")
    .trim();

  if (!cleaned) {
    return 0;
  }

  const isNegative = cleaned.startsWith("-") || cleaned.endsWith("-");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized = cleaned;

  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, "");
  }

  normalized = normalized.replace(/(?!^)-/g, "").replace(/-$/g, "");

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return isNegative ? Math.abs(value) : value;
};

export const extractDateFromLine = (line) => {
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

export const isLikelyHeaderLine = (line) => {
  const upper = normalizeForMatch(line);
  return HEADER_MARKERS.some((marker) => upper.includes(marker));
};

export const isLikelyNonTransactionLine = (line) => {
  const upper = normalizeForMatch(line);
  return NON_TRANSACTION_MARKERS.some((marker) => upper.includes(normalizeForMatch(marker)));
};
