import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Waiting for approval</h1>
      <p className="mt-3 text-[var(--muted)]">
        An admin was emailed about your signup. You can sign in after they activate your account.
      </p>
      <Link href="/login" className="btn btn-primary mt-8 w-full">
        Back to sign in
      </Link>
    </div>
  );
}
