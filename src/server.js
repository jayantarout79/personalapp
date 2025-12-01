const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const multer = require("multer");
const config = require("./config");
const {
  extractTransactionFromImage,
  extractDocumentFromImage,
  extractPolicyFromFile,
  extractTransactionFromText,
} = require("./aiService");
const { authenticate } = require("./authMiddleware");
const {
  allowedCategories,
  allowedPaymentMethods,
  saveTransaction,
  editTransaction,
  removeTransaction,
  getTransactionsWithFilters,
  computeInsights,
} = require("./transactionsService");
const { getBudgetStatuses, saveBudget } = require("./budgetsService");
const { getDocuments, saveDocument, editDocument, removeDocument } = require("./documentsService");
const {
  getPolicies,
  getPolicyInsights,
  savePolicy,
  editPolicy,
  removePolicy,
} = require("./policiesService");
const { scheduleDocumentEmails } = require("./scheduler");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", module: "Finance Tracker" });
});

app.get("/api/meta", (_req, res) => {
  res.json({ data: { categories: allowedCategories, paymentMethods: allowedPaymentMethods } });
});

// Protected routes
app.use("/api", (req, res, next) => {
  // Allow health/meta without auth
  if (req.path === "/health" || req.path === "/meta") return next();
  return authenticate(req, res, next);
});

app.post("/api/transactions", async (req, res, next) => {
  try {
    const record = await saveTransaction({
      ...req.body,
      source: req.body.source || "Manual",
    });
    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.get("/api/transactions", async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
    };
    const items = await getTransactionsWithFilters(filters);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

app.put("/api/transactions/:id", async (req, res, next) => {
  try {
    const record = await editTransaction(req.params.id, {
      ...req.body,
      source: req.body.source || "Manual",
    });
    res.json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/transactions/:id", async (req, res, next) => {
  try {
    await removeTransaction(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

app.get("/api/insights", async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
    };
    const items = await getTransactionsWithFilters(filters);
    const insights = computeInsights(items);
    res.json({ data: insights });
  } catch (err) {
    next(err);
  }
});

app.post("/api/ai/extract", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Image file is required");
      error.status = 400;
      throw error;
    }
    const data = await extractTransactionFromImage(req.file.buffer, req.file.originalname);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.post("/api/ai/documents", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Image file is required");
      error.status = 400;
      throw error;
    }
    const data = await extractDocumentFromImage(req.file.buffer, req.file.originalname);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.post("/api/ai/policies", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Image or PDF file is required");
      error.status = 400;
      throw error;
    }
    const data = await extractPolicyFromFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.post("/api/ai/text", async (req, res, next) => {
  try {
    const { note } = req.body || {};
    if (!note || typeof note !== "string") {
      const error = new Error("Note text is required");
      error.status = 400;
      throw error;
    }
    const data = await extractTransactionFromText(note);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.get("/api/budgets", async (_req, res, next) => {
  try {
    const data = await getBudgetStatuses();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.post("/api/budgets", async (req, res, next) => {
  try {
    const record = await saveBudget(req.body.category, req.body.monthlyLimit);
    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.get("/api/documents", async (req, res, next) => {
  try {
    const data = await getDocuments({
      monthsWindow: req.query.months,
      upcomingOnly: req.query.upcoming === "true",
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.post("/api/documents", async (req, res, next) => {
  try {
    const record = await saveDocument(req.body);
    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.put("/api/documents/:id", async (req, res, next) => {
  try {
    const record = await editDocument(req.params.id, req.body);
    res.json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/documents/:id", async (req, res, next) => {
  try {
    await removeDocument(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

app.get("/api/policies", async (req, res, next) => {
  try {
    const data = await getPolicies({
      monthsWindow: req.query.months,
      upcomingOnly: req.query.upcoming === "true",
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.get("/api/policies/insights", async (_req, res, next) => {
  try {
    const data = await getPolicyInsights();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

app.post("/api/policies", async (req, res, next) => {
  try {
    const record = await savePolicy(req.body);
    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.put("/api/policies/:id", async (req, res, next) => {
  try {
    const record = await editPolicy(req.params.id, req.body);
    res.json({ data: record });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/policies/:id", async (req, res, next) => {
  try {
    await removePolicy(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

if (fs.existsSync(config.clientDistPath)) {
  app.use(express.static(config.clientDistPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(config.clientDistPath, "index.html"));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Server error",
  });
});

app.listen(config.port, () => {
  console.log(`My Smart Desk backend running on http://localhost:${config.port}`);
});

scheduleDocumentEmails();
