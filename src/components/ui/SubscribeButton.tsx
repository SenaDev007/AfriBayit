"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
  plan: string;
  label: string;
  className?: string;
}

export default function SubscribeButton({ plan, label, className }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, paymentMethod: "mobile_money" }),
      });

      if (res.status === 401) {
        // Not logged in — redirect to login
        router.push("/login?redirect=/tarifs");
        return;
      }

      if (res.ok) {
        router.push("/dashboard?subscribed=1");
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={loading}
      className={className}
    >
      {loading ? "Traitement..." : label}
    </button>
  );
}
