import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDateFromLine,
  isValidNormalizedDate,
  isLikelyNonTransactionLine,
  parseCurrencyValue,
} from "../src/lib/ocr-parser-utils.js";

test("parseCurrencyValue handles BRL format", () => {
  assert.equal(parseCurrencyValue("R$ 1.234,56"), 1234.56);
});

test("parseCurrencyValue handles trailing minus sign", () => {
  assert.equal(parseCurrencyValue("123,45-"), 123.45);
});

test("parseCurrencyValue handles invalid content", () => {
  assert.equal(parseCurrencyValue("abc"), 0);
});

test("isLikelyNonTransactionLine detects balance and totals", () => {
  assert.equal(isLikelyNonTransactionLine("Saldo final do dia"), true);
  assert.equal(isLikelyNonTransactionLine("Total de saídas"), true);
  assert.equal(isLikelyNonTransactionLine("07/02 Uber viagem 32,90"), false);
});

test("extractDateFromLine parses full date", () => {
  const extracted = extractDateFromLine("12/01/2025 UBER 49,90");
  assert.equal(extracted?.normalizedDate, "2025-01-12");
});

test("extractDateFromLine infers year for short date", () => {
  const extracted = extractDateFromLine("07/02 UBER 32,90");
  assert.ok(extracted?.normalizedDate.match(/^\d{4}-02-07$/));
});

test("extractDateFromLine rejects impossible calendar dates", () => {
  const extracted = extractDateFromLine("31/02/2025 Uber 49,90");
  assert.equal(extracted, null);
});

test("isValidNormalizedDate validates leap years correctly", () => {
  assert.equal(isValidNormalizedDate("2024-02-29"), true);
  assert.equal(isValidNormalizedDate("2025-02-29"), false);
});
