import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { matchDB } from '@/lib/db';
import { z } from 'zod';

const createMatchSchema = z.object({
  team_id: z.number(),
  match_date: z.string(),
  location: z.string().optional(),
  opponent_team: z.string().optional(),
  status: z.string().default('scheduled'),
});

export async function GET(request: NextRequest) {
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

    // Tüm maçları getir
    const matches = await matchDB.getAll();

    return NextResponse.json({ matches });

  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

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
    const { team_id, match_date, location, opponent_team, status } = createMatchSchema.parse(body);

    // Maç oluştur
    const match = await matchDB.create({
      team_id,
      match_date,
      location,
      opponent_team,
      status
    });

    if (!match) {
      return NextResponse.json({ error: 'Maç oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Maç başarıyla oluşturuldu', 
      match 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create match error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 