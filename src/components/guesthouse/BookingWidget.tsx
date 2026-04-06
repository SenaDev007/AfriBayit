"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface BookingWidgetProps {
  guesthouseId: string;
  rooms: Array<{ id: string; name: string; basePrice: number; currency: string }>;
}

type BookingState = "idle" | "loading" | "success" | "error" | "unauthenticated";

export default function BookingWidget({ guesthouseId, rooms }: BookingWidgetProps) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [state, setState] = useState<BookingState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedRoom = rooms.find((r) => r.id === roomId) ?? rooms[0];

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const totalPrice = nights > 0 && selectedRoom ? nights * selectedRoom.basePrice : 0;

  const today = new Date().toISOString().split("T")[0];

  async function handleReserve() {
    if (!checkIn || !checkOut || nights < 1) {
      setErrorMsg("Veuillez sélectionner des dates valides.");
      return;
    }
    if (!roomId) {
      setErrorMsg("Veuillez choisir une chambre.");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: guesthouseId,
          roomId,
          checkIn,
          checkOut,
          guests,
          totalPrice,
        }),
      });

      if (res.status === 401) {
        setState("unauthenticated");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Une erreur est survenue. Réessayez.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Impossible de contacter le serveur. Vérifiez votre connexion.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Réservation envoyée !</h3>
        <p className="text-sm text-gray-500 mb-1">
          Votre demande a été transmise au propriétaire.
        </p>
        <p className="text-sm text-gray-500 mb-5">
          Vous recevrez une confirmation sous 24h.
        </p>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => {
            setState("idle");
            setCheckIn("");
            setCheckOut("");
            setGuests(1);
          }}
        >
          Nouvelle réservation
        </Button>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Connexion requise</h3>
        <p className="text-sm text-gray-500 mb-5">
          Connectez-vous pour réserver cette chambre et accéder à toutes vos réservations.
        </p>
        <a href="/login" className="block">
          <Button variant="primary" size="md" fullWidth>
            Se connecter
          </Button>
        </a>
        <a href="/register" className="block mt-2">
          <Button variant="outline" size="md" fullWidth>
            Créer un compte
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Réserver une chambre</h3>
      {selectedRoom && (
        <p className="text-sm text-[#0070BA] font-semibold mb-4">
          À partir de {formatCurrency(selectedRoom.basePrice, selectedRoom.currency)}/nuit
        </p>
      )}

      {/* Room selector */}
      {rooms.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Chambre
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {formatCurrency(r.basePrice, r.currency)}/nuit
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Check-in */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Arrivée
        </label>
        <input
          type="date"
          min={today}
          value={checkIn}
          onChange={(e) => {
            setCheckIn(e.target.value);
            if (checkOut && e.target.value >= checkOut) setCheckOut("");
          }}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent"
        />
      </div>

      {/* Check-out */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Départ
        </label>
        <input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent"
        />
      </div>

      {/* Guests */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Voyageurs
        </label>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} voyageur{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Price breakdown */}
      {nights > 0 && selectedRoom && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              {formatCurrency(selectedRoom.basePrice, selectedRoom.currency)} × {nights} nuit{nights > 1 ? "s" : ""}
            </span>
            <span>{formatCurrency(selectedRoom.basePrice * nights, selectedRoom.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Frais de service (12 %)</span>
            <span>{formatCurrency(Math.round(totalPrice * 0.12), selectedRoom.currency)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
            <span>Total</span>
            <span>{formatCurrency(Math.round(totalPrice * 1.12), selectedRoom.currency)}</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {(state === "error" || errorMsg) && (
        <p className="text-sm text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={state === "loading"}
        onClick={handleReserve}
        disabled={!checkIn || !checkOut || nights < 1}
      >
        Réserver maintenant
      </Button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Paiement sécurisé · Mobile Money accepté
      </p>
    </div>
  );
}
