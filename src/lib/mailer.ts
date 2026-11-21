import { getNotificationEmail } from "./store";

async function deliver(to: string, subject: string, text: string, logBody: boolean): Promise<{ sent: boolean; mode: "resend" | "local" }> {
  if (!to.includes("@")) return { sent: false, mode: "local" };
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (logBody) console.info(`[sample mail] to=${to} subject=${subject}\n${text}`);
    else console.info(`[sample mail] to=${to} subject=${subject} (body omitted)`);
    return { sent: false, mode: "local" };
  }
  const from = process.env.RESEND_FROM_EMAIL || "NunezTracker <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) {
    console.info(`[mail failed ${res.status}] ${subject}`);
    return { sent: false, mode: "resend" };
  }
  return { sent: true, mode: "resend" };
}

export async function sendAdminMail(subject: string, text: string) {
  const to = (await getNotificationEmail()).trim() || "raypn93@gmail.com";
  return deliver(to, subject, text, true);
}

