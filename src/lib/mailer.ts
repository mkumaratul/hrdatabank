import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export interface SendMailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: SendMailAttachment[];
}) {
  const fromName = process.env.SMTP_FROM_NAME ?? "HR Databank";
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;

  const transport = getTransporter();
  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}
