const nodemailer = require("nodemailer");
const config = require("./config");

let transporter = null;

if (config.mailer.host && config.mailer.user && config.mailer.pass) {
  transporter = nodemailer.createTransport({
    host: config.mailer.host,
    port: config.mailer.port,
    secure: config.mailer.port === 465,
    auth: {
      user: config.mailer.user,
      pass: config.mailer.pass,
    },
  });
}

const sendEmail = async (subject, html) => {
  if (!transporter || !config.mailer.to || !config.mailer.from) {
    console.warn("Email skipped: mailer is not configured.");
    return;
  }

  await transporter.sendMail({
    from: config.mailer.from,
    to: config.mailer.to,
    subject,
    html,
  });
};

module.exports = {
  sendEmail,
};
