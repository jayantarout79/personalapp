const dayjs = require("dayjs");
const OpenAI = require("openai");
const config = require("./config");

const client = config.openai.apiKey
  ? new OpenAI({ apiKey: config.openai.apiKey })
  : null;

const extractJson = (text) => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    const fenceMatch = text.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    const jsonLike = fenceMatch ? fenceMatch[1] : null;
    const arrayMatch = jsonLike
      ? jsonLike.match(/\[[\s\S]*\]/)
      : text.match(/\[[\s\S]*\]/);
    const objectMatch = jsonLike
      ? jsonLike.match(/\{[\s\S]*\}/)
      : text.match(/\{[\s\S]*\}/);
    const candidate = arrayMatch?.[0] || objectMatch?.[0] || jsonLike;
    if (!candidate) return {};
    try {
      return JSON.parse(candidate);
    } catch (innerErr) {
      return {};
    }
  }
};

const normalizeTransaction = (raw) => ({
  date: raw.date || dayjs().format("YYYY-MM-DD"),
  amount: raw.amount ? Number(raw.amount) : 0,
  currency: raw.currency || "USD",
  category: raw.category || "Other",
  paymentMethod: raw.paymentMethod || "Other",
  description: raw.description || "",
  source: "Image AI",
});

const normalizeTransactionList = (raw) => {
  const listSource = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.transactions)
      ? raw.transactions
      : [raw];

  return listSource
    .map(normalizeTransaction)
    .filter((item) => item.amount > 0 && (item.description || item.category));
};

const normalizeDocument = (raw) => ({
  title: raw.title || raw.name || "",
  docType: raw.docType || raw.type || "",
  expirationDate: raw.expirationDate || raw.expiryDate || "",
  number: raw.number || raw.documentNumber || "",
  notes: raw.notes || "",
  source: "Image AI",
});

const normalizeDocumentList = (raw) => {
  const listSource = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.documents)
      ? raw.documents
      : [raw];
  return listSource
    .map(normalizeDocument)
    .filter((item) => item.title || item.expirationDate || item.docType);
};

const normalizePolicy = (raw) => ({
  policyName: raw.policyName || raw.name || raw.title || "",
  provider: raw.provider || raw.company || raw.insurer || "",
  policyType: raw.policyType || raw.type || "",
  policyNumber: raw.policyNumber || raw.number || "",
  premiumAmount: raw.premiumAmount ? Number(raw.premiumAmount) : 0,
  currency: raw.currency || "USD",
  paymentFrequency: raw.paymentFrequency || raw.frequency || "Monthly",
  startDate: raw.startDate || "",
  endDate: raw.endDate || "",
  nextPaymentDate: raw.nextPaymentDate || raw.paymentDueDate || raw.dueDate || "",
  notes: raw.notes || raw.coverage || "",
  source: "Policy AI",
});

const normalizePolicyList = (raw) => {
  const listSource = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.policies)
      ? raw.policies
      : [raw];
  return listSource
    .map(normalizePolicy)
    .filter((item) => item.policyName || item.provider || item.nextPaymentDate);
};

const normalizeTransactionFromText = (raw) => ({
  date: raw.date || dayjs().format("YYYY-MM-DD"),
  amount: raw.amount ? Number(raw.amount) : 0,
  currency: raw.currency || "USD",
  category: raw.category || "Other",
  paymentMethod: raw.paymentMethod || "Other",
  description: raw.description || raw.merchant || "",
  source: "Text AI",
});

const extractTransactionFromImage = async (buffer, filename = "receipt.jpg") => {
  if (!client) {
    throw new Error("OpenAI is not configured. Unable to extract data from image.");
  }

  const base64Image = buffer.toString("base64");

  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a finance assistant that extracts a single expense transaction from a receipt or payment screenshot. Respond with compact JSON only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Read this receipt or SMS screenshot and extract every expense transaction you see. Respond with a JSON array (always an array, even for a single item). For each transaction return: date (YYYY-MM-DD from the screenshot; do NOT invent a future date), amount (positive number, use decimals), currency (ISO 4217, default USD), category (Food, Rent, Grocery, Travel, Shopping, Utilities, Other), paymentMethod (Cash, Credit Card, Debit Card, UPI, Other), description (merchant + a few words). Split separate notifications/lines into separate array items. Ignore balances or totals. Never output zero or negative amounts. JSON array only.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);
  const normalized = normalizeTransactionList(parsed);

  if (normalized.length === 0) {
    throw new Error("AI could not read any transactions from the image.");
  }

  return normalized;
};

const extractTransactionFromText = async (text) => {
  if (!client) {
    throw new Error("OpenAI is not configured. Unable to extract data from text.");
  }

  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "You are a finance assistant that extracts expense transactions from natural language notes.",
      },
      {
        role: "user",
        content:
          "Read the following note and extract one expense transaction. Return JSON with keys: date (YYYY-MM-DD, default today if missing), amount (number), currency (ISO 4217, default USD), category (Food, Rent, Grocery, Travel, Shopping, Utilities, Other), paymentMethod (Cash, Credit Card, Debit Card, UPI, Other), description (short merchant/intent). JSON only.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);
  const normalized = normalizeTransactionFromText(parsed);
  if (!normalized.amount || normalized.amount <= 0) {
    throw new Error("AI could not find an amount in the note.");
  }
  return normalized;
};

const extractDocumentFromImage = async (buffer, filename = "document.jpg") => {
  if (!client) {
    throw new Error("OpenAI is not configured. Unable to extract data from image.");
  }

  const base64Image = buffer.toString("base64");

  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that reads official documents (passport, visa, driver license, ID cards, insurance) and extracts expiry details. Respond with concise JSON only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Read this document or screenshot and extract every document you can. Return a JSON array (always an array). Each item must include: title (short doc title or holder name + doc type), docType (passport, visa, driving license, ID, insurance, other), expirationDate (YYYY-MM-DD), number (document number if visible), notes (any country/type info). If a date is missing, leave it empty instead of guessing. JSON array only.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);
  const normalized = normalizeDocumentList(parsed);
  if (normalized.length === 0) {
    throw new Error("AI could not read any documents from the image.");
  }
  return normalized;
};

const extractPolicyFromImage = async (buffer, filename = "policy.jpg") => {
  if (!client) {
    throw new Error("OpenAI is not configured. Unable to extract data from image.");
  }

  const base64Image = buffer.toString("base64");

  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You extract insurance policy details and premium due dates from photos or screenshots. Respond with concise JSON only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Read this image and extract every insurance or policy you see. Always respond with a JSON array. Each item must include: policyName (plan name), provider (insurer/company), policyType (life, health, auto, home, other), policyNumber, premiumAmount (numeric, default 0 if missing), currency (ISO 4217, default USD), paymentFrequency (Monthly, Quarterly, Yearly, One-time), nextPaymentDate (YYYY-MM-DD if present), startDate, endDate, notes (coverage highlights). Do not invent dates; leave them empty if not visible. JSON array only.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);
  const normalized = normalizePolicyList(parsed);
  if (normalized.length === 0) {
    throw new Error("AI could not read any policies from the image.");
  }
  return normalized;
};

const extractPolicyFromFile = async (buffer, mimetype = "application/octet-stream", filename) => {
  if (mimetype && mimetype.toLowerCase().includes("pdf")) {
    const error = new Error("PDF policy extraction is disabled on this deployment.");
    error.status = 503;
    throw error;
  }
  return extractPolicyFromImage(buffer, filename);
};

module.exports = {
  extractTransactionFromImage,
  extractDocumentFromImage,
  extractTransactionFromText,
  extractPolicyFromFile,
};
