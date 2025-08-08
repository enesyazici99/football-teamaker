import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { playerDB, teamDB } from '@/lib/db';
import { z } from 'zod';

const leaveTeamSchema = z.object({
  team_id: z.number(),
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
    const { team_id } = leaveTeamSchema.parse(body);

    // Takımın var olduğunu kontrol et
    const team = await teamDB.getById(team_id);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu takımda oyuncu olup olmadığını kontrol et
    const player = await playerDB.getByUserId(decoded.id);
    const isPlayerInTeam = player.some(p => p.team_id === team_id && p.is_active);
    
    if (!isPlayerInTeam) {
      return NextResponse.json({ error: 'Bu takımda oyuncu değilsiniz' }, { status: 400 });
    }

    // Takımdan ayrıl
    const result = await playerDB.leaveTeam(decoded.id, team_id);
    if (!result) {
      return NextResponse.json({ error: 'Takımdan ayrılma işlemi başarısız' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Takımdan başarıyla ayrıldınız' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Leave team error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 