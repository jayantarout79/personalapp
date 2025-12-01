const cron = require("node-cron");
const config = require("./config");
const { getDocuments } = require("./documentsService");
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

module.exports = {
  scheduleDocumentEmails,
};
