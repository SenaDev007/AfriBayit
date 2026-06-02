// AfriBayit — Socket.io API Route
// Socket.io requires a custom HTTP server which is not directly supported
// by Next.js App Router in serverless environments.
//
// For production WebSocket support, use the mini-service at mini-services/realtime-service/
// For serverless environments, use the SSE fallback at /api/realtime/sse

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      service: 'AfriBayit Real-time',
      status: 'available',
      transports: {
        websocket: {
          status: 'requires_custom_server',
          note: 'Socket.io requires a custom HTTP server. Use mini-services/realtime-service/ for production.',
          path: '/api/socketio',
        },
        sse: {
          status: 'available',
          note: 'Server-Sent Events fallback for serverless environments.',
          path: '/api/realtime/sse',
          method: 'GET',
          auth: 'required',
        },
      },
      events: [
        'notification:new',
        'message:new',
        'escrow:update',
        'property:update',
        'booking:update',
      ],
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
    note: 'Use SSE endpoint at /api/realtime/sse for serverless real-time events',
  });
}
