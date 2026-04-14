import { NextResponse } from 'next/server'

const stats = [
  { label: 'Biens disponibles', number: '1 250+' },
  { label: 'Investisseurs actifs', number: '3 800+' },
  { label: 'Villes couvertes', number: '42' },
  { label: 'Taux de satisfaction', number: '97%' }
]

export async function GET() {
  return NextResponse.json({ stats })
}
