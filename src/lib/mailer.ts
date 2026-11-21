import { getNotificationEmail } from "./store";

export async function sendAdminMail(subject: string, text: string): Promise<{ sent: boolean; mode: "resend" | "local" }> {
  const to = (await getNotificationEmail()).trim();
  if (!to) return { sent: false, mode: "local" };
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[sample mail] to=${to} subject=${subject}\n${text}`);
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
