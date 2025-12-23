import OpenAI from "openai";
import type { ParsedTransaction } from "./pdfParser";

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy_key",
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return openai;
}

export interface ClassifiedTransaction {
  date: Date;
  amount: number;
  description: string;
  category: "reimbursable" | "not_reimbursable" | "review";
  tag: string | null;
  confidence: number;
  highlightTokens: string[];
}

const REIMBURSABLE_KEYWORDS = [
  "custas", "custa", "emolumentos", "diligencia", "diligencia",
  "cartorio", "cartório", "tabeliao", "tabelião", "registro",
  "oficial", "autenticacao", "autenticação", "reconhecimento",
  "certidao", "certidão", "taxa judiciaria", "taxa judiciária",
  "preparo", "porte", "remessa", "junta comercial", "tribunal",
  "tjsp", "tjrj", "trf", "stf", "stj", "gru", "darf",
  "transporte", "uber", "99", "taxi", "táxi", "cabify",
  "estacionamento", "pedagio", "pedágio", "combustivel", "combustível",
  "xerox", "copia", "cópia", "impressao", "impressão",
  "correio", "sedex", "ar", "postagem", "protocolo"
];

const NOT_REIMBURSABLE_KEYWORDS = [
  "salario", "salário", "folha", "inss", "fgts", "pis",
  "agua", "água", "luz", "energia", "telefone", "internet",
  "aluguel", "condominio", "condomínio", "iptu", "ipva",
  "mercado", "supermercado", "restaurante", "lanche",
  "netflix", "spotify", "amazon", "ifood",
  "transferencia", "transferência", "pix", "ted", "doc",
  "saque", "deposito", "depósito", "resgate", "aplicacao", "aplicação"
];

function findMatchingKeywords(description: string, keywords: string[]): string[] {
  const descLower = description.toLowerCase();
  return keywords.filter(keyword => descLower.includes(keyword.toLowerCase()));
}

function classifyByKeywords(description: string): {
  category: "reimbursable" | "not_reimbursable" | "review";
  confidence: number;
  highlightTokens: string[];
} {
  const reimbursableMatches = findMatchingKeywords(description, REIMBURSABLE_KEYWORDS);
  const notReimbursableMatches = findMatchingKeywords(description, NOT_REIMBURSABLE_KEYWORDS);

  if (reimbursableMatches.length > 0 && notReimbursableMatches.length === 0) {
    return {
      category: "reimbursable",
      confidence: Math.min(0.9, 0.5 + reimbursableMatches.length * 0.1),
      highlightTokens: reimbursableMatches,
    };
  }

  if (notReimbursableMatches.length > 0 && reimbursableMatches.length === 0) {
    return {
      category: "not_reimbursable",
      confidence: Math.min(0.9, 0.5 + notReimbursableMatches.length * 0.1),
      highlightTokens: notReimbursableMatches,
    };
  }

  return {
    category: "review",
    confidence: 0.3,
    highlightTokens: [...reimbursableMatches, ...notReimbursableMatches],
  };
}

function determineTag(description: string, category: string): string | null {
  if (category !== "reimbursable") return null;

  const descLower = description.toLowerCase();

  if (descLower.match(/cartorio|cartório|tabeliao|tabelião|registro|certid/)) {
    return "Cartorio";
  }
  if (descLower.match(/custas|custa|preparo|taxa judic|emolumentos/)) {
    return "Custas Processuais";
  }
  if (descLower.match(/uber|99|taxi|táxi|cabify|transporte/)) {
    return "Transporte";
  }
  if (descLower.match(/pedagio|pedágio|estacionamento|combustivel|combustível/)) {
    return "Deslocamento";
  }
  if (descLower.match(/correio|sedex|postagem/)) {
    return "Correios";
  }
  if (descLower.match(/xerox|copia|cópia|impressao|impressão/)) {
    return "Copias";
  }
  if (descLower.match(/diligencia|diligência/)) {
    return "Diligencias";
  }

  return "Outros";
}

export async function classifyTransactions(
  transactions: ParsedTransaction[]
): Promise<ClassifiedTransaction[]> {
  const classified: ClassifiedTransaction[] = [];

  for (const tx of transactions) {
    const { category, confidence, highlightTokens } = classifyByKeywords(tx.description);
    const tag = determineTag(tx.description, category);

    classified.push({
      date: tx.date,
      amount: tx.amount,
      description: tx.description,
      category,
      tag,
      confidence,
      highlightTokens,
    });
  }

  return classified;
}

export async function classifyTransactionsWithAI(
  transactions: ParsedTransaction[]
): Promise<ClassifiedTransaction[]> {
  if (transactions.length === 0) return [];

  const keywordClassified = await classifyTransactions(transactions);

  const reviewItems = keywordClassified.filter(t => t.category === "review");

  if (reviewItems.length === 0) {
    return keywordClassified;
  }

  try {
    const prompt = `Voce e um assistente especializado em classificar despesas juridicas brasileiras.

Para cada transacao abaixo, classifique como:
- "reimbursable": Despesas que advogados podem cobrar de clientes (custas processuais, cartorios, diligencias, transporte para audiencias, correios, copias)
- "not_reimbursable": Despesas pessoais ou operacionais do escritorio (salarios, aluguel, contas, alimentacao)

Responda APENAS com JSON valido no formato:
{"results": [{"index": 0, "category": "reimbursable", "tag": "Custas Processuais", "confidence": 0.85}, ...]}

Tags disponiveis: "Custas Processuais", "Cartorio", "Transporte", "Deslocamento", "Correios", "Copias", "Diligencias", "Outros"

Transacoes para classificar:
${reviewItems.map((t, i) => `${i}. ${t.description} - R$ ${Math.abs(t.amount).toFixed(2)}`).join('\n')}`;

    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      console.warn("AI_INTEGRATIONS_OPENAI_API_KEY is not set. Skipping AI classification.");
      return keywordClassified;
    }

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.results && Array.isArray(parsed.results)) {
        for (const result of parsed.results) {
          const reviewItem = reviewItems[result.index];
          if (reviewItem) {
            const originalIndex = keywordClassified.findIndex(
              t => t.description === reviewItem.description && t.date === reviewItem.date
            );
            if (originalIndex !== -1) {
              keywordClassified[originalIndex].category = result.category || "review";
              keywordClassified[originalIndex].tag = result.tag || null;
              keywordClassified[originalIndex].confidence = result.confidence || 0.7;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("AI classification failed, using keyword-based results:", error);
  }

  return keywordClassified;
}
