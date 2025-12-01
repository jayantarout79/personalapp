const dayjs = require("dayjs");
const config = require("./config");
const {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} = require("./supabaseClient");

const validateDocument = (payload) => {
  const errors = [];
  if (!payload.title) errors.push("title is required");
  if (!payload.expirationDate) errors.push("expirationDate is required");

  if (errors.length) {
    const error = new Error(errors.join(", "));
    error.status = 400;
    throw error;
  }

  return {
    title: payload.title,
    docType: payload.docType || "",
    expirationDate: payload.expirationDate,
    number: payload.number || "",
    notes: payload.notes || "",
    source: payload.source || "Manual",
    email: payload.email || "",
  };
};

const getDocuments = async ({ monthsWindow, upcomingOnly } = {}) => {
  const all = await listDocuments();
  if (!upcomingOnly && !monthsWindow) return all;

  const now = dayjs();
  const until = now.add(
    Number(monthsWindow || config.documents.expiryMonths),
    "month"
  );

  return all.filter((doc) => {
    if (!doc.expirationDate) return false;
    const exp = dayjs(doc.expirationDate);
    return exp.isSame(now, "day") || (exp.isAfter(now, "day") && exp.isBefore(until, "day"));
  });
};

const saveDocument = async (payload) => {
  const validated = validateDocument(payload);
  return createDocument(validated);
};

const editDocument = async (id, payload) => {
  if (!id) {
    const error = new Error("document id is required");
    error.status = 400;
    throw error;
  }
  const validated = validateDocument(payload);
  return updateDocument(id, validated);
};

const removeDocument = async (id) => {
  if (!id) {
    const error = new Error("document id is required");
    error.status = 400;
    throw error;
  }
  return deleteDocument(id);
};

module.exports = {
  getDocuments,
  saveDocument,
  editDocument,
  removeDocument,
};
