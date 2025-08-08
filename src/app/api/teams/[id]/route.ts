import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB, userDB } from '@/lib/db';

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

    // Takım bilgilerini getir
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Kullanıcı bilgilerini getir
    const currentUser = await userDB.getById(decoded.id);

    return NextResponse.json({ team, currentUser });

  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

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
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Geçersiz takım ID' }, { status: 400 });
    }

    // Request body'yi parse et
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Takım adı gerekli' }, { status: 400 });
    }

    // Takım bilgilerini kontrol et
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Yetki kontrolü - sadece takım sahibi, kaptan veya yetkili üyeler
    const isTeamOwner = team.created_by === decoded.id;
    const isCaptain = team.captain_id === decoded.id;
    const isAuthorizedMember = team.authorized_members?.includes(decoded.id);

    if (!isTeamOwner && !isCaptain && !isAuthorizedMember) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmuyor' }, { status: 403 });
    }

    // Takım adını güncelle
    const updatedTeam = await teamDB.update(teamId, { name: name.trim() });
    
    return NextResponse.json({ 
      message: 'Takım bilgileri güncellendi',
      team: updatedTeam 
    });

  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

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
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Geçersiz takım ID' }, { status: 400 });
    }

    // Takım bilgilerini kontrol et
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Yetki kontrolü - sadece takım sahibi
    if (team.created_by !== decoded.id) {
      return NextResponse.json({ error: 'Sadece takım sahibi takımı silebilir' }, { status: 403 });
    }

    // Takımı sil (CASCADE ile ilişkili veriler de silinecek)
    await teamDB.delete(teamId);
    
    return NextResponse.json({ 
      message: 'Takım başarıyla silindi' 
    });

  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 