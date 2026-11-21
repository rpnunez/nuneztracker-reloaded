import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="auth">
      <h1 className="page-title">Waiting for approval</h1>
      <p className="lede">An admin was emailed about your signup. You can sign in after they activate your account.</p>
      <Link href="/login" className="btn btn-primary" style={{ marginTop: "1.75rem" }}>
        Back to sign in
      </Link>
    </div>
  );
}
