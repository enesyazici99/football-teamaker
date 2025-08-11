import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { playerRatingDB, playerDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const teamId = parseInt(id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Geçersiz takım ID' }, { status: 400 });
    }

    // Takımdaki tüm oyuncuları al
    const players = await playerDB.getByTeamId(teamId);
    
    // Her oyuncu için tüm puanlamaları al
    const allRatings = [];
    for (const player of players) {
      const ratings = await playerRatingDB.getByPlayerId(player.id);
      allRatings.push(...ratings);
    }

    return NextResponse.json({ ratings: allRatings });

  } catch (error) {
    console.error('Get team ratings error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}