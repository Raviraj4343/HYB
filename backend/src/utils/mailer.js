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

export default sendMail;
