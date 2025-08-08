import { NextRequest, NextResponse } from 'next/server';
import { playerRatingDB, matchDB, playerDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const matchIdNum = parseInt(matchId);
    if (isNaN(matchIdNum)) {
      return NextResponse.json({ error: 'Geçersiz maç ID' }, { status: 400 });
    }

    const ratings = await playerRatingDB.getByMatchId(matchIdNum);
    
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error('Ratings fetch error:', error);
    return NextResponse.json({ error: 'Puanlamalar yüklenemedi' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const matchIdNum = parseInt(matchId);
    if (isNaN(matchIdNum)) {
      return NextResponse.json({ error: 'Geçersiz maç ID' }, { status: 400 });
    }

    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const body = await request.json();
    const { rated_player_id, rater_player_id, rating, notes } = body;

    // Validasyon
    if (!rated_player_id || !rater_player_id || !rating) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json({ error: 'Puan 1-10 arasında olmalıdır' }, { status: 400 });
    }

    // Maçın var olduğunu kontrol et
    const match = await matchDB.getById(matchIdNum);
    if (!match) {
      return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 });
    }

    // Oyuncuların var olduğunu kontrol et
    const ratedPlayer = await playerDB.getById(rated_player_id);
    const raterPlayer = await playerDB.getById(rater_player_id);
    
    if (!ratedPlayer || !raterPlayer) {
      return NextResponse.json({ error: 'Oyuncu bulunamadı' }, { status: 404 });
    }

    // Aynı takımda olduklarını kontrol et
    if (ratedPlayer.team_id !== raterPlayer.team_id) {
      return NextResponse.json({ error: 'Farklı takımlardaki oyuncular birbirini puanlayamaz' }, { status: 400 });
    }

    // Kendini puanlayamaz
    if (rated_player_id === rater_player_id) {
      return NextResponse.json({ error: 'Kendinizi puanlayamazsınız' }, { status: 400 });
    }

    // Maçın bitip bitmediğini kontrol et
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000)); // 2 saat sonra
    
    if (now <= matchEndTime) {
      return NextResponse.json({ error: 'Maç henüz bitmemiş' }, { status: 400 });
    }

    // Puanlamayı kaydet
    const savedRating = await playerRatingDB.upsert({
      match_id: matchIdNum,
      rated_player_id,
      rater_player_id,
      rating,
      notes
    });

    return NextResponse.json({ 
      message: 'Puanlama başarıyla kaydedildi',
      rating: savedRating[0]
    });
  } catch (error) {
    console.error('Rating save error:', error);
    return NextResponse.json({ error: 'Puanlama kaydedilemedi' }, { status: 500 });
  }
} 