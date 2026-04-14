import { NextRequest, NextResponse } from 'next/server'

const quickReplies = [
  'Je peux vous aider a trouver une propriete selon votre budget.',
  'Souhaitez-vous des biens premium verifies dans votre ville ?',
  'Je peux aussi vous orienter vers les etapes KYC et escrow.'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = String(body.message || '').toLowerCase()

    let reply = quickReplies[0]
    if (message.includes('escrow') || message.includes('transaction')) {
      reply = 'Le module escrow est disponible: vous pouvez suivre le statut de votre transaction en temps reel.'
    } else if (message.includes('hotel')) {
      reply = "Je peux vous guider vers les hotels disponibles et la reservation."
    } else if (message.includes('formation') || message.includes('learning')) {
      reply = 'Je peux recommander des cours selon votre profil investisseur.'
    }

    return NextResponse.json({
      assistant: 'Rebecca',
      reply,
      handoffAvailable: true
    })
  } catch (error) {
    console.error('Rebecca chat error:', error)
    return NextResponse.json({ message: 'Erreur chat Rebecca' }, { status: 500 })
  }
}
