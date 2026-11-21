export async function register() {
  const { ensureBootstrapAdmin } = await import("./lib/bootstrap-admin");
  await ensureBootstrapAdmin();
}
