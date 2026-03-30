import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import sendMail from '../utils/mailer.js';

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json(new ApiResponse(400, null, 'Email and message are required'));
  }

  // Deliver inbound messages to site owner (EMAIL_FROM) configured in backend .env
  const to = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mailSubject = subject ? `Website contact: ${subject}` : `Website contact from ${name || email}`;
  const text = `${message}\n\nFrom: ${name || 'Anonymous'} <${email}>`;
  const html = `<p>${(message || '').replace(/\n/g, '<br/>')}</p><hr/><p>From: ${name || 'Anonymous'} &lt;${email}&gt;</p>`;

  await sendMail({ to, subject: mailSubject, text, html });

  return res.status(200).json(new ApiResponse(200, null, 'Message delivered'));
});

export default { submitContact };
