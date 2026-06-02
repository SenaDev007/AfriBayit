// AfriBayit — API: USSD Callback for Africa's Talking
// POST: Handles USSD session start, continuation, and end

import { NextResponse } from 'next/server';
import { handleUSSD } from '@/lib/ussd/ussd-engine';

/**
 * Africa's Talking USSD Callback Endpoint
 * 
 * Receives USSD requests from Africa's Talking gateway.
 * Implements the full USSD state machine with session management.
 * 
 * Expected POST body (form-urlencoded):
 * - sessionId: Unique session identifier
 * - serviceCode: The USSD code dialed (e.g., *384*123#)
 * - phoneNumber: The user's phone number
 * - text: User input (full navigation path separated by *)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string || '';
    const serviceCode = formData.get('serviceCode') as string || '';
    const phoneNumber = formData.get('phoneNumber') as string || '';
    const text = formData.get('text') as string || '';

    // Validate required fields
    if (!sessionId || !phoneNumber) {
      return new NextResponse('END Erreur de session. Réessayez.', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Process USSD request through state machine
    const result = await handleUSSD(sessionId, serviceCode, phoneNumber, text);

    // Return response in Africa's Talking format
    // CON = Continue session, END = Terminate session
    return new NextResponse(result.response, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('[USSD] Callback error:', error);
    return new NextResponse(
      'END Service temporairement indisponible. Réessayez plus tard.',
      {
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  }
}

// GET handler for health check / service info
export async function GET() {
  return NextResponse.json({
    service: 'AfriBayit USSD',
    version: '2.0',
    status: 'active',
    provider: "Africa's Talking",
    supportedCountries: ['BJ', 'CI', 'BF', 'TG'],
    menus: ['search', 'my_bookings', 'my_properties', 'help'],
    features: [
      'session_management',
      'property_search',
      'booking_list',
      'property_list',
      'contact_agent',
    ],
  });
}
