export default function CheckEmailPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link. Open it to finish creating your account.
        </p>
        <p className="text-sm text-muted-foreground">
          If you do not see it, check your spam folder.
        </p>
      </div>
    </div>
  );
}
