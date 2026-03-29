import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMail = async ({ to, subject, text, html }) => {
  const from = process.env.EMAIL_FROM;

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
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
