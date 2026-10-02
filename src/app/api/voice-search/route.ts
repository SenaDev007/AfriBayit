import { NextResponse } from 'next/server';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';

/**
 * GET /api/voice-search
 * POST /api/voice-search  { audio: "data:audio/wav;base64,..." }
 *
 * Transcription vocale serveur pour la recherche immobilière (fallback des
 * navigateurs sans Web Speech API — Firefox, Safari iOS). Le client enregistre
 * le micro via MediaRecorder, ré-encode en WAV 16 kHz mono, puis envoie le
 * résultat en base64 ici. La route interroge NVIDIA NIM (build.nvidia.com)
 * avec le modèle omni multi-modal, dont l'API REST est compatible OpenAI :
 *
 *   POST https://integrate.api.nvidia.com/v1/chat/completions
 *   Authorization: Bearer $NVIDIA_API_KEY
 *   { model, messages: [{ role: 'user', content: [
 *       { type: 'audio_url', audio_url: { url: 'data:audio/wav;base64,…' } },
 *       { type: 'text', text: 'Transcris…' } ] }] }
 *
 * Formats audio acceptés par le NIM : WAV, MP3, FLAC.
 *
 * Variables d'environnement (Vercel → Settings → Environment Variables) :
 *   - NVIDIA_API_KEY      clé API personnelle générée sur build.nvidia.com
 *   - NVIDIA_ASR_MODEL    (optionnel) défaut : nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
 *   - NVIDIA_API_BASE     (optionnel) défaut : https://integrate.api.nvidia.com
 *
 * Sans NVIDIA_API_KEY : GET répond { configured: false } et POST répond 503 —
 * l'UI affiche un message propre, la Web Speech API reste le chemin principal.
 */

const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
const MAX_BODY_CHARS = 9_000_000; // ≈ 6,7 Mo de WAV base64 (~3 min à 16 kHz mono)
const MAX_TRANSCRIPT_CHARS = 200;

const AUDIO_DATA_URI_RE = /^data:audio\/(wav|x-wav|mpeg|mp3|flac);base64,[A-Za-z0-9+/=]+$/;

const TRANSCRIBE_PROMPT = [
  "Transcris fidèlement cet enregistrement vocal.",
  "C'est une recherche immobilière sur la plateforme AfriBayit (Afrique de l'Ouest).",
  'Réponds UNIQUEMENT avec le texte transcrit, en français, en une seule ligne,',
  'sans guillemets, sans préfixe, sans commentaire. Si l\'audio est vide ou inaudible, réponds exactement: (vide)',
].join(' ');

function envConfig() {
  const apiKey = process.env.NVIDIA_API_KEY || '';
  return {
    apiKey,
    model: process.env.NVIDIA_ASR_MODEL || DEFAULT_MODEL,
    base: (process.env.NVIDIA_API_BASE || 'https://integrate.api.nvidia.com').replace(/\/+$/, ''),
    configured: apiKey.length > 0,
  };
}

export async function GET() {
  const { configured, model } = envConfig();
  return NextResponse.json({ configured, model: configured ? model : null });
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request);
    const rl = await rateLimit(`voice-search:${rlKey}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Trop de recherches vocales. Réessayez dans une minute.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } },
      );
    }

    let body: { audio?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Corps JSON invalide.' },
        { status: 400 },
      );
    }

    const audio = typeof body.audio === 'string' ? body.audio : '';
    if (!audio || !AUDIO_DATA_URI_RE.test(audio) || audio.length > MAX_BODY_CHARS) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Audio manquant, format non supporté (WAV/MP3/FLAC base64 requis) ou trop volumineux.',
        },
        { status: 400 },
      );
    }

    const { apiKey, model, base, configured } = envConfig();
    if (!configured) {
      return NextResponse.json(
        {
          error: 'not_configured',
          message:
            'Reconnaissance vocale serveur non configurée : ajoutez NVIDIA_API_KEY (build.nvidia.com) dans les variables d\'environnement.',
        },
        { status: 503 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let nvidiaResponse: Response;
    try {
      nvidiaResponse = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'audio_url', audio_url: { url: audio } },
                { type: 'text', text: TRANSCRIBE_PROMPT },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0,
          stream: false,
          // Désactive la phase de raisonnement du modèle omni quand supporté
          // (réponse directe = latence réduite).
          chat_template_kwargs: { think: false },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!nvidiaResponse.ok) {
      const detail = await nvidiaResponse.text().catch(() => '');
      console.error(
        `[voice-search] NVIDIA ${nvidiaResponse.status}: ${detail.slice(0, 300)}`,
      );
      return NextResponse.json(
        { error: 'server', message: 'Erreur lors de la transcription. Réessayez.' },
        { status: 502 },
      );
    }

    const json = (await nvidiaResponse.json().catch(() => null)) as {
      choices?: Array<{
        message?: { content?: string | null; reasoning?: string | null };
      }>;
    } | null;

    let transcript = json?.choices?.[0]?.message?.content ?? '';
    // Certains NIM nemotron renvoient le texte utile dans `reasoning`
    if (!transcript) transcript = json?.choices?.[0]?.message?.reasoning ?? '';
    // Nettoyage défensif : balises de raisonnement résiduelles, guillemets, multi-lignes
    transcript = transcript
      .replace(/<\/?think>/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^["«»'\s]+|["«»'\s.]+$/g, '')
      .trim()
      .slice(0, MAX_TRANSCRIPT_CHARS);

    if (!transcript || /^\(vide\)$/i.test(transcript)) {
      return NextResponse.json(
        { error: 'empty', message: 'Aucune parole détectée dans cet enregistrement.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ transcript, model });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'timeout', message: 'Transcription trop lente. Réessayez.' },
        { status: 504 },
      );
    }
    console.error('[voice-search] Unexpected error:', error);
    return NextResponse.json(
      { error: 'server', message: 'Erreur inattendue lors de la transcription.' },
      { status: 500 },
    );
  }
}
