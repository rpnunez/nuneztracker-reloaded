import bcrypt from "bcryptjs";
import { createBootstrapAdmin, isAdminSeeded, markAdminSeeded } from "./store";

export const BOOTSTRAP_ADMIN_EMAIL = "raypn93@gmail.com";

const g = globalThis as unknown as { __ntBootDone?: boolean; __ntBooting?: Promise<void> };

export function ensureBootstrapAdmin() {
  if (g.__ntBootDone) return Promise.resolve();
  if (!g.__ntBooting) {
    g.__ntBooting = runBootstrap().finally(() => {
      g.__ntBooting = undefined;
    });
  }
  return g.__ntBooting;
}

async function runBootstrap() {
  if (await isAdminSeeded()) {
    g.__ntBootDone = true;
    return;
  }
  const password = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  if (!password) return;
  const hash = await bcrypt.hash(password, 10);
  await createBootstrapAdmin(BOOTSTRAP_ADMIN_EMAIL, "Raymond", hash);
  await markAdminSeeded();
  g.__ntBootDone = true;
}
