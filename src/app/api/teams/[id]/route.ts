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