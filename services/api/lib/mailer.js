// Sends transactional email through Resend's HTTP API (https://resend.com).
// Without RESEND_API_KEY (local dev), the email is printed to the console
// instead so the flow can still be tested end-to-end.
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[mailer] RESEND_API_KEY not set - email to ${to}:\n${subject}\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, text }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
  }
}

module.exports = { sendEmail };
