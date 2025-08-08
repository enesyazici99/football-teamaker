import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { matchDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Token kontrolü
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // Kullanıcının takımlarındaki yaklaşan maçları getir
    const upcomingMatches = await matchDB.getUpcomingMatchesByUserId(decoded.id);

    return NextResponse.json({ matches: upcomingMatches });

  } catch (error) {
    console.error('Get upcoming matches error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 