import * as fs from "fs";
const pdfParse = require("pdf-parse");

export interface ParsedTransaction {
  date: Date;
  amount: number;
  description: string;
  rawLine: string;
}

export interface PDFParseResult {
  text: string;
  transactions: ParsedTransaction[];
  bankName: string | null;
  period: {
    start: Date | null;
    end: Date | null;
  };
}

const DATE_PATTERNS = [
  /(\d{2})\/(\d{2})\/(\d{4})/,
  /(\d{2})\/(\d{2})\/(\d{2})/,
  /(\d{2})-(\d{2})-(\d{4})/,
  /(\d{2})-(\d{2})-(\d{2})/,
];

const AMOUNT_PATTERN = /[+-]?\s*R?\$?\s*([\d.,]+(?:\.\d{2}|\,\d{2})?)(?:\s*[CD])?/i;

const BANK_PATTERNS: Record<string, RegExp> = {
  'Itau': /ita[uú]/i,
  'Bradesco': /bradesco/i,
  'Banco do Brasil': /banco do brasil|bb/i,
  'Santander': /santander/i,
  'Caixa': /caixa econ[oô]mica|cef/i,
  'Nubank': /nubank|nu pagamentos/i,
  'Inter': /banco inter/i,
  'Sicoob': /sicoob/i,
  'Sicredi': /sicredi/i,
};

function parseDate(dateStr: string): Date | null {
  for (const pattern of DATE_PATTERNS) {
    const match = dateStr.match(pattern);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) {
        year = `20${year}`;
      }
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return null;
}

function parseAmount(amountStr: string): number | null {
  const match = amountStr.match(AMOUNT_PATTERN);
  if (!match) return null;

  let value = match[1]
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;

  if (amountStr.includes('-') || amountStr.includes('D')) {
    return -Math.abs(parsed);
  }

  return Math.abs(parsed);
}

function detectBank(text: string): string | null {
  for (const [bankName, pattern] of Object.entries(BANK_PATTERNS)) {
    if (pattern.test(text)) {
      return bankName;
    }
  }
  return null;
}

function extractTransactions(text: string): ParsedTransaction[] {
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    let foundDate: Date | null = null;
    let foundAmount: number | null = null;

    for (const pattern of DATE_PATTERNS) {
      const dateMatch = line.match(pattern);
      if (dateMatch) {
        foundDate = parseDate(dateMatch[0]);
        break;
      }
    }

    const amountMatch = line.match(AMOUNT_PATTERN);
    if (amountMatch) {
      foundAmount = parseAmount(amountMatch[0]);
    }

    if (foundDate && foundAmount !== null && Math.abs(foundAmount) > 0.01) {
      let description = line;
      for (const pattern of DATE_PATTERNS) {
        description = description.replace(pattern, '');
      }
      description = description.replace(AMOUNT_PATTERN, '');
      description = description.replace(/\s+/g, ' ').trim();

      if (description.length > 3) {
        transactions.push({
          date: foundDate,
          amount: foundAmount,
          description: description,
          rawLine: line.trim(),
        });
      }
    }
  }

  return transactions;
}

export async function parsePDF(filePath: string): Promise<PDFParseResult> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text;

  const bankName = detectBank(text);
  const transactions = extractTransactions(text);

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (transactions.length > 0) {
    const sortedDates = transactions
      .map(t => t.date)
      .sort((a, b) => a.getTime() - b.getTime());
    startDate = sortedDates[0];
    endDate = sortedDates[sortedDates.length - 1];
  }

  return {
    text,
    transactions,
    bankName,
    period: {
      start: startDate,
      end: endDate,
    },
  };
}

export function extractTextContent(text: string): string {
  return text
    .split('\n')
    .filter(line => line.trim().length > 3)
    .join('\n');
}
