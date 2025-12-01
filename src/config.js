const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const config = {
  port: process.env.PORT || 3000,
  clientDistPath: path.resolve(__dirname, "..", "client", "dist"),
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    tableName: process.env.SUPABASE_TABLE_NAME || "transactions",
    budgetTableName: process.env.SUPABASE_BUDGETS_TABLE_NAME || "budgets",
    documentsTableName: process.env.SUPABASE_DOCUMENTS_TABLE_NAME || "documents",
    policiesTableName: process.env.SUPABASE_POLICIES_TABLE_NAME || "policies",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  documents: {
    expiryMonths: Number(process.env.DOCUMENT_EXPIRY_MONTHS || 8),
  },
  mailer: {
    from: process.env.NOTIFY_FROM_EMAIL,
    to: process.env.NOTIFY_TO_EMAIL,
    host: process.env.NOTIFY_SMTP_HOST,
    port: Number(process.env.NOTIFY_SMTP_PORT || 587),
    user: process.env.NOTIFY_SMTP_USER,
    pass: process.env.NOTIFY_SMTP_PASS,
  },
};

module.exports = config;
