// AfriBayit — Booking.com Webhook (legacy path)
// This route is kept for backward compatibility with old webhook URLs.
// The canonical route is at /api/ota/webhooks/booking-com (plural).
// This file simply re-exports the handler from the canonical route.

export { POST } from '../../webhooks/booking-com/route';
