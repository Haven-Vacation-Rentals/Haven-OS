"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f7f7",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: 32,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 6px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 20, fontWeight: 700 }}>
            Haven OS hit a problem
          </h1>
          <p style={{ color: "#555", fontSize: 14 }}>
            We logged the error and are looking into it. Please try again.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#999",
              }}
            >
              ref {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #FF564E",
              background: "#FF564E",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
