import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB, teamInvitationDB } from '@/lib/db';

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

    // Takımı getir
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Yetki kontrolü - sadece takım sahibi, kaptan veya yetkili üyeler görebilir
    const isTeamOwner = team.created_by === decoded.id;
    const isCaptain = team.captain_id === decoded.id;
    const isInAuthorizedMembers = team.authorized_members?.includes(decoded.id) || false;
    const isAuthorized = isTeamOwner || isCaptain || isInAuthorizedMembers;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Takımın davetlerini getir
    const invitations = await teamInvitationDB.getByTeamId(teamId);

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Get team invitations error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}