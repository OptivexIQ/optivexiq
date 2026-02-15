"use client";

import { useEffect } from "react";

type ReportsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReportsError({ error, reset }: ReportsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ padding: "2rem" }}>
      <h2>Unable to load report</h2>
      <p>Please try again.</p>
      <button onClick={() => reset()}>Retry</button>
    </main>
  );
}
