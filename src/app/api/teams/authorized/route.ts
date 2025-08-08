import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const body = await request.json();
    const { team_id, user_id, action } = body;

    if (!team_id || !user_id || !action) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    // Takımı getir
    const team = await teamDB.getById(team_id);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Sadece takım sahibi yetkili üye ekleyebilir/çıkarabilir
    if (team.created_by !== decoded.id) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Takım sahibi kendisini yetkili yapamaz
    if (user_id === decoded.id) {
      return NextResponse.json({ error: 'Kendinizi yetkili yapamazsınız' }, { status: 400 });
    }

    let updatedTeam;
    if (action === 'add') {
      updatedTeam = await teamDB.addAuthorizedMember(team_id, user_id);
    } else if (action === 'remove') {
      updatedTeam = await teamDB.removeAuthorizedMember(team_id, user_id);
    } else {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

    if (!updatedTeam) {
      return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: action === 'add' ? 'Yetkili üye eklendi' : 'Yetkili üye çıkarıldı',
      team: updatedTeam
    });

  } catch (error) {
    console.error('Authorized member error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 