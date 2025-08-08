import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB, formationDB, formationUtils } from '@/lib/db';

export async function PUT(
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
    const body = await request.json();
    const { team_size } = body;

    // Takım boyutunu kontrol et
    if (team_size < 6 || team_size > 11) {
      return NextResponse.json({ error: 'Takım boyutu 6-11 arasında olmalıdır' }, { status: 400 });
    }

    // Takımın sahibi veya kaptanı olup olmadığını kontrol et
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    const isTeamOwner = team.created_by === decoded.id;
    const isAuthorized = isTeamOwner || team.captain_id === decoded.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Takım boyutunu güncelle
    const updatedTeam = await teamDB.update(teamId, { team_size });

    // Formasyonu da güncelle (varsayılan formasyon)
    const defaultFormation = formationUtils.getAvailableFormations(team_size)[0];
    const formation = await formationDB.upsert({
      team_id: teamId,
      formation_name: defaultFormation.name,
      team_size
    });

    return NextResponse.json({
      success: true,
      team: updatedTeam,
      formation,
      message: 'Takım boyutu güncellendi'
    });
  } catch (error) {
    console.error('Takım boyutu güncelleme hatası:', error);
    return NextResponse.json({ error: 'Takım boyutu güncellenemedi' }, { status: 500 });
  }
} 