"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/ui/CalendarPicker";
import { cn } from "@/lib/utils";

interface BookingWidgetProps {
  propertyId: string;
  propertyTitle: string;
  nightlyRate: number;
  currency: string;
  maxGuests?: number;
}

const GUEST_COMMISSION = 0.13; // 13% frais de service voyageur (CDC §6.2)

export default function BookingWidget({
  propertyId,
  propertyTitle,
  nightlyRate,
  currency,
  maxGuests = 10,
}: BookingWidgetProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [step, setStep] = useState<"dates" | "confirm">("dates");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch booked dates for current + next 2 months
  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/availability`);
      if (res.ok) {
        const data = await res.json();
        setBookedDates(data.bookedDates ?? []);
      }
    } catch { /* silent */ }
  }, [propertyId]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  function handleSelect(start: string, end: string | null) {
    setSelectedStart(start);
    setSelectedEnd(end);
    setError(null);
  }

  // Computed values
  const nights = selectedStart && selectedEnd
    ? Math.ceil((new Date(selectedEnd).getTime() - new Date(selectedStart).getTime()) / 86400000)
    : 0;
  const baseAmount = nights * nightlyRate;
  const serviceFee = Math.round(baseAmount * GUEST_COMMISSION);
  const totalAmount = baseAmount + serviceFee;

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " " + currency;
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  async function handleBook() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/properties/${propertyId}`);
      return;
    }
    if (!selectedStart || !selectedEnd) {
      setError("Veuillez sélectionner vos dates.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          checkIn: selectedStart,
          checkOut: selectedEnd,
          guests,
          paymentMethod: "mobile_money",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la réservation.");
        return;
      }

      // Redirect to payment URL if provided, otherwise to dashboard
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push("/dashboard/transactions?booking=created");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const canBook = selectedStart && selectedEnd && nights > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
      {/* Price header */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-bold text-[#003087]">{fmt(nightlyRate)}</span>
        <span className="text-gray-400 text-sm">/ nuit</span>
      </div>

      {/* Date selection */}
      {step === "dates" && (
        <>
          {/* Selected range summary */}
          {(selectedStart || selectedEnd) && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className={cn(
                "border rounded-xl px-3 py-2 text-center",
                selectedStart ? "border-[#003087] bg-blue-50" : "border-gray-200"
              )}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Arrivée</p>
                <p className="text-sm font-bold text-[#003087]">
                  {selectedStart ? fmtDate(selectedStart) : "—"}
                </p>
              </div>
              <div className={cn(
                "border rounded-xl px-3 py-2 text-center",
                selectedEnd ? "border-[#003087] bg-blue-50" : "border-gray-200"
              )}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Départ</p>
                <p className="text-sm font-bold text-[#003087]">
                  {selectedEnd ? fmtDate(selectedEnd) : "—"}
                </p>
              </div>
            </div>
          )}

          <CalendarPicker
            bookedDates={bookedDates}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            onSelect={handleSelect}
          />

          {/* Guests */}
          <div className="mt-4 flex items-center justify-between py-3 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Voyageurs</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                disabled={guests <= 1}
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-bold text-gray-800">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                disabled={guests >= maxGuests}
              >
                +
              </button>
            </div>
          </div>

          {/* Price breakdown (visible when range selected) */}
          {canBook && (
            <div className="mt-3 space-y-1.5 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>{fmt(nightlyRate)} × {nights} nuit{nights > 1 ? "s" : ""}</span>
                <span>{fmt(baseAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de service (13%)</span>
                <span>{fmt(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
                <span>Total</span>
                <span className="text-[#003087]">{fmt(totalAmount)}</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs mt-3 text-center">{error}</p>
          )}

          <button
            type="button"
            onClick={handleBook}
            disabled={!canBook || loading}
            className="mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all
              bg-[#003087] text-white hover:bg-[#002070] active:scale-95
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </span>
            ) : !session?.user ? (
              "Connectez-vous pour réserver"
            ) : !canBook ? (
              "Sélectionnez vos dates"
            ) : (
              `Réserver — ${fmt(totalAmount)}`
            )}
          </button>

          <p className="text-[10px] text-gray-400 text-center mt-2">
            🔒 Paiement 100% sécurisé via Escrow AfriBayit
          </p>
        </>
      )}
    </div>
  );
}
