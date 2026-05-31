import { NextResponse } from 'next/server';

/**
 * POST /api/voice-search
 * 
 * Whisper AI fallback for voice search transcription.
 * Accepts base64-encoded audio data and returns transcribed text.
 * Used when the browser's Web Speech API is unavailable or fails.
 * 
 * Supports multilingual transcription: French, Fon, Dioula, Moore,
 * and other West African languages via the z-ai-web-dev-sdk ASR service.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audio } = body as { audio?: string };

    if (!audio) {
      return NextResponse.json(
        { error: 'Données audio requises (base64)' },
        { status: 400 }
      );
    }

    // Validate base64 audio data
    if (typeof audio !== 'string' || audio.length === 0) {
      return NextResponse.json(
        { error: 'Format audio invalide' },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk for Whisper AI transcription
    const { default: ZAI } = await import('z-ai-web-dev-sdk');
    const zai = new ZAI();

    const response = await zai.audio.asr.create({
      file_base64: audio,
    });

    const transcribedText = response.text?.trim() || '';

    if (!transcribedText) {
      return NextResponse.json(
        { error: 'Aucune parole détectée dans l\'audio', text: '' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      text: transcribedText,
      source: 'whisper-ia',
      language: 'multilingual',
    });
  } catch (error) {
    console.error('Voice search API error:', error);
    return NextResponse.json(
      { error: 'Erreur de transcription. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
