import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB, playerDB } from '@/lib/db';

export async function DELETE(
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
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'Oyuncu ID gerekli' }, { status: 400 });
    }

    // Takımı getir
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Sadece takım sahibi oyuncu çıkarabilir
    if (team.created_by !== decoded.id) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Takım sahibi kendini çıkaramaz
    const player = await playerDB.getById(playerId);
    if (!player) {
      return NextResponse.json({ error: 'Oyuncu bulunamadı' }, { status: 404 });
    }

    if (player.user_id === decoded.id) {
      return NextResponse.json({ error: 'Kendinizi takımdan çıkaramazsınız' }, { status: 400 });
    }

    // Oyuncu takımda mı kontrol et
    if (player.team_id !== teamId) {
      return NextResponse.json({ error: 'Oyuncu bu takımda değil' }, { status: 400 });
    }

    // Oyuncuyu takımdan çıkar (soft delete - is_active = false)
    await playerDB.update(playerId, { is_active: false });

    // Eğer oyuncu kaptansa, kaptanlığı kaldır
    if (team.captain_id === player.user_id) {
      await teamDB.update(teamId, { captain_id: null });
    }

    // Eğer oyuncu yetkili üyeyse, yetkiyi kaldır
    if (team.authorized_members?.includes(player.user_id)) {
      await teamDB.removeAuthorizedMember(teamId, player.user_id);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Oyuncu takımdan çıkarıldı' 
    });

  } catch (error) {
    console.error('Remove player error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}