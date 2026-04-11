import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Rebecca AI — CDC §8.2 — Claude Sonnet backbone
// Requires ANTHROPIC_API_KEY in .env.local

const SYSTEM_PROMPT = `Tu es Rebecca, l'assistante IA d'AfriBayit — la plateforme immobilière pan-africaine couvrant le Bénin, la Côte d'Ivoire, le Burkina Faso et le Togo.

Ton rôle :
- Aider les utilisateurs à trouver des propriétés, logements, hôtels, artisans
- Expliquer le système d'escrow obligatoire pour toutes les transactions
- Guider vers les bonnes sections de la plateforme
- Répondre en français (ou en anglais si l'utilisateur écrit en anglais)
- Être concise, professionnelle et chaleureuse

Règles importantes :
- L'escrow est OBLIGATOIRE pour toutes les transactions (vente, location, artisans)
- Ne jamais recommander de paiement direct entre parties
- Mentionner GeoTrust pour la validation physique des terrains
- Commissions : 2-5% vente, 1 mois loyer pour location longue durée, 3% hôte STR
- KYC niveaux : KYC0 (navigation), KYC1 (500K XOF/mois), KYC2 (5M), KYC3 (illimité)

Services AfriBayit :
- Immobilier (vente, location courte/longue durée)
- Hôtels & OTA (630+ hôtels partenaires)
- GeoTrust (validation physique par géomètres certifiés)
- ProMatch Artisans (7 corps de métier)
- Academy (formations immobilières)
- Communauté (gamification, points, badges)

Pays couverts : Bénin 🇧🇯, Côte d'Ivoire 🇨🇮, Burkina Faso 🇧🇫, Togo 🇹🇬

Ne réponds PAS aux sujets hors immobilier/construction/investissement Afrique.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const { message, sessionId, history = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  // Build messages array
  const messages = [
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  let reply: string;

  // Use Claude API if key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      });

      reply = (response.content[0] as { type: string; text: string }).text;
    } catch (err) {
      console.error("Claude API error:", err);
      reply = getRuleBasedReply(message);
    }
  } else {
    // Fallback rule-based responses
    reply = getRuleBasedReply(message);
  }

  // Persist chat session
  try {
    if (sessionId) {
      await prisma.aIChatSession.update({
        where: { id: sessionId },
        data: {
          messages: [
            ...history,
            { role: "user", content: message, ts: new Date().toISOString() },
            { role: "assistant", content: reply, ts: new Date().toISOString() },
          ],
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.aIChatSession.create({
        data: {
          userId: session?.user?.id ?? null,
          channel: "web",
          messages: [
            { role: "user", content: message, ts: new Date().toISOString() },
            { role: "assistant", content: reply, ts: new Date().toISOString() },
          ],
        },
      });
    }
  } catch {
    // Non-blocking — chat still works
  }

  return NextResponse.json({ reply });
}

function getRuleBasedReply(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("escrow") || msg.includes("paiement") || msg.includes("sécuris")) {
    return "Tous les paiements sur AfriBayit passent par notre système d'**escrow sécurisé**. Les fonds sont bloqués jusqu'à validation de la transaction par les deux parties. Aucun paiement direct n'est autorisé — c'est votre protection contre la fraude. 🔐";
  }
  if (msg.includes("geotrust") || msg.includes("géomètre") || msg.includes("terrain") || msg.includes("superficie")) {
    return "**GeoTrust** est notre service de validation physique des terrains par des géomètres certifiés (niveaux Standard, Expert, Elite). Nos géomètres vérifient la superficie réelle, les bornes, et établissent un rapport officiel. Pack Standard à partir de 75 000 FCFA. 📐";
  }
  if (msg.includes("hotel") || msg.includes("hôtel") || msg.includes("chambre")) {
    return "AfriBayit propose **630+ hôtels partenaires** au Bénin, Côte d'Ivoire, Burkina Faso et Togo. Nos partenaires directs offrent les meilleurs tarifs, certains avec connexion OTA (Booking.com, Expedia). Trouvez votre hôtel sur [/hotels](/hotels). 🏨";
  }
  if (msg.includes("artisan") || msg.includes("plombier") || msg.includes("électricien") || msg.includes("maçon")) {
    return "Notre service **ProMatch** connecte avec des artisans certifiés : maçons, plombiers, électriciens, menuisiers et plus. Tous vérifiés, notés par la communauté. Disponible sur [/artisans](/artisans). 🔧";
  }
  if (msg.includes("diaspora") || msg.includes("investir") || msg.includes("investissement")) {
    return "AfriBayit est idéal pour la diaspora africaine ! Nous proposons des services spécialisés : vérification GeoTrust à distance, gestion locative, score d'investissement automatique et conseillers dédiés. Commencez par [/properties](/properties). 🌍";
  }
  if (msg.includes("kyc") || msg.includes("vérification") || msg.includes("identité")) {
    return "**Niveaux KYC AfriBayit :**\n- KYC0 : Navigation libre\n- KYC1 : 500 000 XOF/mois (CNI + selfie)\n- KYC2 : 5 000 000 XOF/mois (documents complets)\n- KYC3 : Illimité (vérification institutionnelle)\n\nCommencez votre vérification dans votre tableau de bord.";
  }
  if (msg.includes("commission") || msg.includes("frais")) {
    return "**Commissions AfriBayit :**\n- Vente immobilière : 2-5%\n- Location longue durée : 1 mois de loyer\n- Location courte durée (hôte) : 3%\n- Hôtels : 10-15%\nTous les frais sont transparents et prélevés via l'escrow. 💰";
  }
  if (msg.includes("academy") || msg.includes("formation") || msg.includes("cours")) {
    return "**AfriBayit Academy** propose des formations certifiantes en immobilier, investissement, droit foncier et construction. Apprenez à votre rythme avec des experts. Découvrez les cours sur [/academy](/academy). 🎓";
  }
  if (msg.includes("bonjour") || msg.includes("salut") || msg.includes("hello") || msg.includes("bonsoir")) {
    return "Bonjour ! Je suis **Rebecca**, votre assistante AfriBayit. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur nos propriétés, hôtels, artisans, ou le service GeoTrust. 😊";
  }
  if (msg.includes("cotonou") || msg.includes("abidjan") || msg.includes("ouagadougou") || msg.includes("lomé")) {
    const city = msg.includes("cotonou") ? "Cotonou" : msg.includes("abidjan") ? "Abidjan" : msg.includes("ouagadougou") ? "Ouagadougou" : "Lomé";
    return `Nous avons de nombreuses propriétés disponibles à **${city}** ! Utilisez notre recherche avancée pour filtrer par type, budget et quartier. Voir les annonces sur [/properties](/properties). 🏠`;
  }

  return "Je suis là pour vous aider avec vos projets immobiliers en Afrique de l'Ouest. Posez-moi une question sur les propriétés, les hôtels, le service GeoTrust, nos artisans certifiés ou le système de paiement sécurisé. 🌍";
}
