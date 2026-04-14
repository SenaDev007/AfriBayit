import { NextResponse } from 'next/server'

const testimonials = [
  {
    id: 't1',
    name: 'Aminata Kone',
    role: 'Investisseuse',
    location: 'Abidjan, CI',
    rating: 5,
    text: "J'ai trouvé un bien rentable en moins de 3 semaines. Le processus est clair et rapide.",
    avatar: 'https://i.pravatar.cc/160?img=32',
    verified: true,
    investment: '85M XOF'
  },
  {
    id: 't2',
    name: 'Moussa Diallo',
    role: 'Entrepreneur',
    location: 'Dakar, SN',
    rating: 5,
    text: 'Interface simple, annonces fiables, et un vrai gain de temps pour comparer les options.',
    avatar: 'https://i.pravatar.cc/160?img=12',
    verified: true,
    investment: '120M XOF'
  },
  {
    id: 't3',
    name: 'Fatou Ndiaye',
    role: 'Acheteuse',
    location: 'Bamako, ML',
    rating: 4,
    text: "J'ai pu finaliser mon achat sereinement avec des informations complètes sur chaque propriété.",
    avatar: 'https://i.pravatar.cc/160?img=5',
    verified: true,
    investment: '42M XOF'
  }
]

export async function GET() {
  return NextResponse.json({ testimonials })
}
