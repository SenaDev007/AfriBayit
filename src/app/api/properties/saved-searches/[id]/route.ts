import { NextResponse } from 'next/server';
import { getSavedSearch, deleteSavedSearch, checkNewMatches } from '@/lib/search/saved-searches';

// GET /api/properties/saved-searches/[id]?userId=xxx&action=check
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const action = searchParams.get('action');
    if (action === 'check') {
      const newMatches = await checkNewMatches(id, userId);
      return NextResponse.json({ newMatches });
    }

    const search = await getSavedSearch(id, userId);
    if (!search) {
      return NextResponse.json({ error: 'Recherche non trouvée' }, { status: 404 });
    }
    return NextResponse.json(search);
  } catch (error) {
    console.error('Get saved search error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/properties/saved-searches/[id]?userId=xxx
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    await deleteSavedSearch(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
