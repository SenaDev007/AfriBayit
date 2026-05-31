// AfriBayit — Socket.io API Route
// This is a placeholder route. Socket.io requires a custom HTTP server
// which is not directly supported by Next.js App Router.
// In production, use a custom server.ts or a dedicated mini-service.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      service: 'AfriBayit Real-time',
      status: 'available',
      note: 'Socket.io requires a custom HTTP server. Use the mini-service at mini-services/realtime-service/ for production.',
      path: '/api/socketio',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    service: 'AfriBayit Real-time',
    status: 'available',
  });
}
