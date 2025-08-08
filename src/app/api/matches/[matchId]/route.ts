import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { matchDB } from '@/lib/db';
import { z } from 'zod';
import { initializeDatabase } from '@/lib/db';

const updateMatchSchema = z.object({
  match_date: z.string().optional(),
  location: z.string().optional(),
  opponent_team: z.string().optional(),
  status: z.string().optional(),
  home_score: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }).optional(),
  away_score: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
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

    const { matchId } = await params;
    const id = parseInt(matchId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz maç ID' }, { status: 400 });
    }

    // Maç bilgilerini getir
    const match = await matchDB.getById(id);
    if (!match) {
      return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ match });

  } catch (error) {
    console.error('Get match error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
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

    const { matchId } = await params;
    const id = parseInt(matchId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz maç ID' }, { status: 400 });
    }

    // Önce maçın var olup olmadığını kontrol et
    const existingMatch = await matchDB.getById(id);
    if (!existingMatch) {
      return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 });
    }

    const body = await request.json();
    console.log('Update match request body:', body);
    
    const updateData = updateMatchSchema.parse(body);
    console.log('Parsed update data:', updateData);

    // Maçı güncelle
    const updatedMatch = await matchDB.update(id, updateData);
    if (!updatedMatch) {
      return NextResponse.json({ error: 'Maç güncellenemedi' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Maç başarıyla güncellendi', 
      match: updatedMatch 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update match error:', error);
    
    // Eğer sütun hatası varsa, migration endpoint'ini öner
    if (error instanceof Error && error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Veritabanı sütunları eksik. Lütfen migration işlemini çalıştırın.',
          migrationUrl: '/api/migrate',
          instructions: 'Tarayıcınızda /api/migrate adresini ziyaret edin veya terminal\'de curl -X POST http://localhost:3000/api/migrate komutunu çalıştırın.'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
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

    const { matchId } = await params;
    const id = parseInt(matchId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz maç ID' }, { status: 400 });
    }

    // Maçı sil
    await matchDB.delete(id);

    return NextResponse.json({ 
      message: 'Maç başarıyla silindi' 
    });

  } catch (error) {
    console.error('Delete match error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 