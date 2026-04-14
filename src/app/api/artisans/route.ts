import { NextResponse } from 'next/server'

const artisans = [
  {
    id: 'ar1',
    fullName: 'Koffi BTP Services',
    specialty: 'Maconnerie',
    city: 'Abidjan',
    rating: 4.8,
    verified: true
  },
  {
    id: 'ar2',
    fullName: 'Awa Electricite Pro',
    specialty: 'Electricite',
    city: 'Lome',
    rating: 4.6,
    verified: true
  }
]

export async function GET() {
  return NextResponse.json({ artisans })
}
