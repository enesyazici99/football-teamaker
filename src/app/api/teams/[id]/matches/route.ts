import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { matchDB } from '@/lib/db';

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

    // Takım maçlarını getir
    const matches = await matchDB.getByTeamId(teamId);

    return NextResponse.json({ matches });

  } catch (error) {
    console.error('Get team matches error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 