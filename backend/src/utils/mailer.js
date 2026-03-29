import nodemailer from 'nodemailer';

const DEFAULT_MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS) || 8000;
const RESEND_API_URL = 'https://api.resend.com/emails';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
const COMMON_PERSONAL_EMAIL_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']);
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.BRECO_API_KEY;

const getMailProvider = () => {
  if (EMAIL_PROVIDER) return EMAIL_PROVIDER;
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'smtp';
};

export const getConfiguredSenderAddress = () => {
  const provider = getMailProvider();
  if (provider === 'resend') {
    return process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || '';
  }

  return process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
};

export const getActiveMailProvider = () => getMailProvider();

export const getMailConfigurationStatus = () => {
  const provider = getMailProvider();

  if (provider === 'resend') {
    const missing = [];
    const resendFrom = getConfiguredSenderAddress();
    if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
    if (!resendFrom) {
      missing.push('RESEND_FROM_EMAIL or EMAIL_FROM');
    }

    const warnings = [];
    const senderMatch = resendFrom?.match(/<([^>]+)>|^([^<\s]+@[^>\s]+)$/);
    const senderEmail = senderMatch?.[1] || senderMatch?.[2] || '';
    const senderDomain = senderEmail.split('@')[1]?.toLowerCase();

    if (senderEmail.endsWith('@resend.dev')) {
      warnings.push(
        `Resend sender "${senderEmail}" is a test sender. It can only send to the email address associated with your Resend account.`
      );
    }

    if (senderDomain && COMMON_PERSONAL_EMAIL_DOMAINS.has(senderDomain) && !senderEmail.endsWith('@resend.dev')) {
      warnings.push(
        `Resend sender "${senderEmail}" looks like a personal inbox. Use a verified domain sender or a resend.dev test sender.`
      );
    }

    return {
      provider,
      configured: missing.length === 0,
      missing,
      warnings,
    };
  }

  if (provider === 'brevo') {
    const missing = [];
    const hasBrevoApi = Boolean(BREVO_API_KEY);
    const hasBrevoSmtp = Boolean(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );

    if (!hasBrevoApi && !hasBrevoSmtp) {
      missing.push('BREVO_API_KEY (or BRECO_API_KEY) or EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS');
    }
    if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');

    const warnings = [];
    const sender = getConfiguredSenderAddress();
    const senderMatch = sender?.match(/<([^>]+)>|^([^<\s]+@[^>\s]+)$/);
    const senderEmail = senderMatch?.[1] || senderMatch?.[2] || '';
    const senderDomain = senderEmail.split('@')[1]?.toLowerCase();

    if (senderDomain && COMMON_PERSONAL_EMAIL_DOMAINS.has(senderDomain)) {
      warnings.push(
        `Brevo sender "${senderEmail}" looks like a personal inbox. Make sure it is verified in Brevo Sender Identities.`
      );
    }

    return {
      provider,
      configured: missing.length === 0,
      missing,
      warnings,
    };
  }

  const missing = [];
  if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');
  if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');

  return {
    provider,
    configured: missing.length === 0,
    missing,
    warnings: [],
  };
};

const getMailConfig = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Email service is not configured. Missing EMAIL_USER or EMAIL_PASS.');
  }

  return {
    host,
    port,
    secure: process.env.EMAIL_SECURE === 'true' || port === 465,
    service: !host || host === 'smtp.gmail.com' ? 'gmail' : undefined,
    auth: {
      user,
      pass,
    },
    connectionTimeout: DEFAULT_MAIL_TIMEOUT_MS,
    greetingTimeout: DEFAULT_MAIL_TIMEOUT_MS,
    socketTimeout: DEFAULT_MAIL_TIMEOUT_MS,
    tls: {
      minVersion: 'TLSv1.2',
    },
  };
};

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(getMailConfig());
  }

  return transporter;
};

const withTimeout = async (promise, timeoutMs, label) => {
  let timer;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const sendWithResend = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getConfiguredSenderAddress();

  if (!apiKey) {
    throw new Error('Resend email provider is not configured. Missing RESEND_API_KEY.');
  }

  if (!from) {
    throw new Error('Resend email provider is not configured. Missing RESEND_FROM_EMAIL or EMAIL_FROM.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_MAIL_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const rawBody = await response.text();
      let parsedBody;

      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = null;
      }

      const resendMessage =
        parsedBody?.message ||
        parsedBody?.error ||
        rawBody;

      if (
        response.status === 403 &&
        from.includes('@resend.dev')
      ) {
        throw new Error(
          'Resend test sender can only deliver to your own Resend account email. Verify a domain in Resend and use that sender to email other users.'
        );
      }

      throw new Error(`Resend API error ${response.status}: ${resendMessage}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

const sendWithBrevoApi = async ({ to, subject, text, html }) => {
  const apiKey = BREVO_API_KEY;
  const from = getConfiguredSenderAddress();

  if (!apiKey) {
    throw new Error('Brevo email provider is not configured. Missing BREVO_API_KEY.');
  }

  if (!from) {
    throw new Error('Brevo email provider is not configured. Missing EMAIL_FROM.');
  }

  const senderMatch = from.match(/^(.*?)<([^>]+)>$/);
  const sender = senderMatch
    ? {
        name: senderMatch[1].trim().replace(/^"|"$/g, ''),
        email: senderMatch[2].trim(),
      }
    : { email: from.trim() };

  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_MAIL_TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: recipients,
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const rawBody = await response.text();
      let parsedBody;

      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = null;
      }

      const brevoMessage =
        parsedBody?.message ||
        parsedBody?.code ||
        rawBody;

      throw new Error(`Brevo API error ${response.status}: ${brevoMessage}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

export const sendMail = async ({ to, subject, text, html }) => {
  const provider = getMailProvider();

  if (provider === 'resend') {
    return withTimeout(
      sendWithResend({ to, subject, text, html }),
      DEFAULT_MAIL_TIMEOUT_MS,
      'Resend email delivery'
    );
  }

  if (provider === 'brevo' && BREVO_API_KEY) {
    return withTimeout(
      sendWithBrevoApi({ to, subject, text, html }),
      DEFAULT_MAIL_TIMEOUT_MS,
      'Brevo email delivery'
    );
  }

  const from = getConfiguredSenderAddress();
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  return withTimeout(
    getTransporter().sendMail(mailOptions),
    DEFAULT_MAIL_TIMEOUT_MS,
    'SMTP email delivery'
  );
};

export const buildAuthCodeEmail = ({
  brand = 'HYB',
  title,
  subtitle,
  code,
  note = 'This code expires in 15 minutes.',
}) => {
  const text = `${title}\n\n${subtitle}\n\nCode: ${code}\n\n${note}`;
  const html = `
    <div style="margin:0;padding:32px 16px;background:#0b111b;font-family:Inter,Arial,sans-serif;color:#e5eef7;">
      <div style="max-width:560px;margin:0 auto;background:linear-gradient(180deg,#111827 0%,#0f1723 100%);border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 18px;border-bottom:1px solid rgba(148,163,184,0.12);background:radial-gradient(circle at top right, rgba(45,212,191,0.18), transparent 35%), #0f1723;">
          <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(45,212,191,0.14);color:#5eead4;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
            ${brand}
          </div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2;color:#f8fafc;">${title}</h1>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#94a3b8;">${subtitle}</p>
        </div>
        <div style="padding:28px;">
          <div style="margin:0 auto 20px;max-width:280px;padding:18px 20px;border-radius:20px;background:linear-gradient(135deg, rgba(45,212,191,0.18), rgba(56,189,248,0.16));border:1px solid rgba(45,212,191,0.25);text-align:center;">
            <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#99f6e4;margin-bottom:8px;">Verification Code</div>
            <div style="font-size:34px;letter-spacing:0.28em;font-weight:800;color:#ffffff;">${code}</div>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;text-align:center;">${note}</p>
        </div>
      </div>
    </div>
  `;

  return { text, html };
};

export const buildAccountRestrictionEmail = ({
  brand = 'HYB',
  title,
  subtitle,
  reason,
  durationLabel,
  untilLabel,
}) => {
  const text = `${title}\n\n${subtitle}\n\nReason: ${reason}\nDuration: ${durationLabel}\nBlocked until: ${untilLabel}`;
  const html = `
    <div style="margin:0;padding:32px 16px;background:#0b111b;font-family:Inter,Arial,sans-serif;color:#e5eef7;">
      <div style="max-width:560px;margin:0 auto;background:linear-gradient(180deg,#111827 0%,#0f1723 100%);border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 18px;border-bottom:1px solid rgba(148,163,184,0.12);background:radial-gradient(circle at top right, rgba(248,113,113,0.2), transparent 35%), #0f1723;">
          <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(248,113,113,0.14);color:#fca5a5;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
            ${brand}
          </div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2;color:#f8fafc;">${title}</h1>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#94a3b8;">${subtitle}</p>
        </div>
        <div style="padding:28px;">
          <div style="padding:20px;border-radius:20px;background:rgba(15,23,42,0.72);border:1px solid rgba(148,163,184,0.18);">
            <div style="margin-bottom:12px;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Reason</div>
              <div style="font-size:16px;color:#f8fafc;font-weight:600;">${reason}</div>
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <div>
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Duration</div>
                <div style="font-size:15px;color:#e2e8f0;">${durationLabel}</div>
              </div>
              <div>
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Blocked Until</div>
                <div style="font-size:15px;color:#e2e8f0;">${untilLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return { text, html };
};

export default sendMail;
