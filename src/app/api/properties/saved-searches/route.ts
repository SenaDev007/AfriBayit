import { NextResponse } from 'next/server';
import { getSavedSearches, saveSearch } from '@/lib/search/saved-searches';
import type { SearchFilters } from '@/lib/search/filters';

// GET /api/properties/saved-searches?userId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    const searches = await getSavedSearches(userId);
    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/properties/saved-searches
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, filters, name } = body as {
      userId: string;
      filters: SearchFilters;
      name: string;
    };

    if (!userId || !filters || !name) {
      return NextResponse.json({ error: 'userId, filters, et name requis' }, { status: 400 });
    }

    const saved = await saveSearch(userId, filters, name);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Save search error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
