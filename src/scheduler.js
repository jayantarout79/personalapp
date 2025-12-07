const dayjs = require("dayjs");
const cron = require("node-cron");
const config = require("./config");
const { getDocuments } = require("./documentsService");
const { getTransactionsWithFilters, computeInsights } = require("./transactionsService");
const { sendEmail } = require("./mailer");

const isMailerReady = () =>
  Boolean(
    config.mailer.host &&
    config.mailer.user &&
    config.mailer.pass &&
    config.mailer.from &&
    config.mailer.to
  );

const isSupabaseReady = () => Boolean(config.supabase.url && config.supabase.key);

const buildDocEmail = (docs) => {
  if (!docs.length) {
    return "<p>No documents expiring in the configured window.</p>";
  }
  const rows = docs
    .map(
      (doc) =>
        `<li><strong>${doc.title || "Document"}</strong> (${doc.docType || "Type?"}) — expires ${doc.expirationDate || "unknown"} ${doc.number ? ` — #${doc.number}` : ""}</li>`
    )
    .join("");
  return `<p>Documents expiring within ${config.documents.expiryMonths} months:</p><ul>${rows}</ul>`;
};

const formatAmount = (amount, currency) => {
  const rounded = Number(amount || 0);
  return `${currency} ${rounded.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const buildExpenseEmail = (transactions, insights) => {
  const currency = transactions.find((tx) => tx.currency)?.currency || "USD";
  const topCategory = insights.topCategory?.category || "N/A";
  const topCategoryAmount = formatAmount(insights.topCategory?.amount || 0, currency);
  const categoryRows = insights.categoryBreakdown
    .slice(0, 5)
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px;">${row.category}</td><td style="padding:8px 12px; text-align:right;">${formatAmount(row.amount, currency)}</td></tr>`
    )
    .join("");

  if (!transactions.length) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f6f8fb; padding:24px; color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
          <h2 style="margin:0 0 12px;">${dayjs().format("MMMM YYYY")} expense pulse</h2>
          <p style="margin:0 0 12px;">No expenses recorded yet this month. Add your first receipt to start the tally.</p>
        </div>
      </div>
    `;
  }

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f6f8fb; padding:24px; color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <div style="padding:20px 24px; background:linear-gradient(135deg,#0ea5e9,#6366f1); color:#fff;">
          <h2 style="margin:0;">${dayjs().format("MMMM YYYY")} expense pulse</h2>
          <p style="margin:6px 0 0; opacity:0.92;">Daily snapshot — ${dayjs().format("dddd, MMM D")}</p>
        </div>
        <div style="padding:24px;">
          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
            <div style="flex:1 1 220px; padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc;">
              <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.04em; color:#475569;">Total spent</p>
              <p style="margin:6px 0 0; font-size:24px; font-weight:700;">${formatAmount(insights.totalSpent, currency)}</p>
              <p style="margin:4px 0 0; color:#475569;">Across ${insights.count} transaction${insights.count === 1 ? "" : "s"}</p>
            </div>
            <div style="flex:1 1 220px; padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc;">
              <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.04em; color:#475569;">Avg / day</p>
              <p style="margin:6px 0 0; font-size:24px; font-weight:700;">${formatAmount(insights.averageDaily, currency)}</p>
              <p style="margin:4px 0 0; color:#475569;">Based on days with spend</p>
            </div>
            <div style="flex:1 1 220px; padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc;">
              <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.04em; color:#475569;">Top category</p>
              <p style="margin:6px 0 0; font-size:24px; font-weight:700;">${topCategory}</p>
              <p style="margin:4px 0 0; color:#475569;">${topCategoryAmount}</p>
            </div>
          </div>
          <div style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
            <div style="background:#f1f5f9; padding:12px 16px; font-weight:600;">Category breakdown (top 5)</div>
            <table style="width:100%; border-collapse:collapse;">
              <tbody>
                ${categoryRows || '<tr><td style="padding:12px 16px;">No categories yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
};

const scheduleDocumentEmails = () => {
  if (!isMailerReady()) {
    console.warn("Document reminder scheduler skipped: mailer env vars are missing.");
    return;
  }
  if (!isSupabaseReady()) {
    console.warn("Document reminder scheduler skipped: Supabase env vars are missing.");
    return;
  }
  // Every Monday at 9:00 AM server time
  cron.schedule("0 9 * * 1", async () => {
    try {
      const docs = await getDocuments({ upcomingOnly: true });
      const html = buildDocEmail(docs);
      await sendEmail("Expiring documents reminder", html);
      console.log(`Document reminder email sent. Items: ${docs.length}`);
    } catch (err) {
      console.error("Document reminder email failed", err);
    }
  });
};

const scheduleExpenseEmails = () => {
  if (!isMailerReady()) {
    console.warn("Expense pulse scheduler skipped: mailer env vars are missing.");
    return;
  }
  if (!isSupabaseReady()) {
    console.warn("Expense pulse scheduler skipped: Supabase env vars are missing.");
    return;
  }

  // Every day at 9:00 AM server time
  cron.schedule("0 9 * * *", async () => {
    try {
      const from = dayjs().startOf("month").format("YYYY-MM-DD");
      const to = dayjs().format("YYYY-MM-DD");
      const transactions = await getTransactionsWithFilters({ from, to });
      const insights = computeInsights(transactions);
      const html = buildExpenseEmail(transactions, insights);
      await sendEmail(`Daily expense pulse — ${dayjs().format("MMM D")}`, html);
      console.log(`Expense pulse email sent. Items: ${transactions.length}`);
    } catch (err) {
      console.error("Expense pulse email failed", err);
    }
  });
};

module.exports = {
  scheduleDocumentEmails,
  scheduleExpenseEmails,
};
