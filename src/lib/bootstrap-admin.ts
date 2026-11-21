import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordMail } from "./mailer";
import { createBootstrapAdmin, getUserByEmail } from "./store";

export const BOOTSTRAP_ADMIN_EMAIL = "raypn93@gmail.com";

const g = globalThis as unknown as { __ntBootDone?: boolean; __ntBooting?: Promise<void> };

export function ensureBootstrapAdmin() {
  if (g.__ntBootDone) return Promise.resolve();
  if (!g.__ntBooting) g.__ntBooting = runBootstrap().finally(() => {
    g.__ntBooting = undefined;
  });
  return g.__ntBooting;
}

async function runBootstrap() {
  const existing = await getUserByEmail(BOOTSTRAP_ADMIN_EMAIL);
  if (existing?.passwordHash && existing.role === "admin" && existing.status === "active") {
    g.__ntBootDone = true;
    return;
  }
  const password = randomBytes(18).toString("base64url");
  const mailed = await sendPasswordMail(BOOTSTRAP_ADMIN_EMAIL, password);
  if (!mailed.sent) return;
  const hash = await bcrypt.hash(password, 10);
  await createBootstrapAdmin(BOOTSTRAP_ADMIN_EMAIL, "Raymond", hash);
  g.__ntBootDone = true;
}
