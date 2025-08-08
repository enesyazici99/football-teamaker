import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB, playerDB } from '@/lib/db';
import { z } from 'zod';

const setCaptainSchema = z.object({
  team_id: z.number(),
  captain_id: z.number(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { team_id, captain_id } = setCaptainSchema.parse(body);

    // Takımın var olduğunu ve kullanıcının takım sahibi olduğunu kontrol et
    const team = await teamDB.getById(team_id);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    if (team.created_by !== decoded.id) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Kaptan olacak kişinin takımda oyuncu olup olmadığını kontrol et
    const player = await playerDB.getByUserId(captain_id);
    const isPlayerInTeam = player.some(p => p.team_id === team_id && p.is_active);
    
    if (!isPlayerInTeam) {
      return NextResponse.json({ error: 'Bu kişi takımınızda oyuncu değil' }, { status: 400 });
    }

    // Takım kaptanını güncelle
    const updatedTeam = await teamDB.updateCaptain(team_id, captain_id);
    if (!updatedTeam) {
      return NextResponse.json({ error: 'Kaptan belirlenemedi' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Takım kaptanı başarıyla belirlendi', 
      team: updatedTeam 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Set captain error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 