import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamDB } from '@/lib/db';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Takım adı gerekli'),
  description: z.string().optional(),
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

    // Kullanıcının takımlarını getir
    const teams = await teamDB.getByUserId(decoded.id);

    return NextResponse.json({ teams });

  } catch (error) {
    console.error('Get teams error:', error);
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
    const { name, description } = createTeamSchema.parse(body);

    // Takım oluştur
    const team = await teamDB.create({
      name,
      description,
      created_by: decoded.id
    });

    if (!team) {
      return NextResponse.json({ error: 'Takım oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Takım başarıyla oluşturuldu', 
      team 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 