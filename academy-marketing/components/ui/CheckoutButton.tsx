"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  productId: string;
  label: string;
  className?: string;
}

export default function CheckoutButton({
  productId,
  label,
  className = "btn-primary text-lg px-10 py-4",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`${className} inline-flex items-center justify-center gap-2 disabled:opacity-60`}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {label}
            <ArrowRight size={20} />
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
