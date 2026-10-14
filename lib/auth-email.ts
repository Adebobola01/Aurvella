import "server-only";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendAuthEmail({
  to,
  subject,
  heading,
  message,
  actionLabel,
  actionUrl,
}: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error(
      "Configure RESEND_API_KEY and AUTH_EMAIL_FROM to send customer authentication emails.",
    );
  }

  const safeHeading = escapeHtml(heading);
  const safeMessage = escapeHtml(message);
  const safeLabel = escapeHtml(actionLabel);
  const safeUrl = escapeHtml(actionUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<main style="font-family:Arial,sans-serif;color:#181818;line-height:1.6"><h1>${safeHeading}</h1><p>${safeMessage}</p><p><a href="${safeUrl}" style="display:inline-block;background:#181818;color:#fff;padding:12px 18px;text-decoration:none">${safeLabel}</a></p><p>If you did not request this, you can ignore this email.</p></main>`,
      text: `${heading}\n\n${message}\n\n${actionLabel}: ${actionUrl}\n\nIf you did not request this, you can ignore this email.`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Resend could not send an authentication email (${response.status}).`);
  }
}
