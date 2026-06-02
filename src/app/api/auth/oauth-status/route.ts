import { NextResponse } from 'next/server';
import { oauthProviders } from '@/lib/auth';

export async function GET() {
  return NextResponse.json(oauthProviders);
}
