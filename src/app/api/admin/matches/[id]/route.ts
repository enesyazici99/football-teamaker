import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { matchDB } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin authentication required
    requireAdmin(request);

    const { id } = await params;
    const matchId = parseInt(id);
    
    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: 'Geçersiz maç ID' },
        { status: 400 }
      );
    }

    // Check if match exists
    const match = await matchDB.getById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Maç bulunamadı' },
        { status: 404 }
      );
    }

    // Delete match from database
    await matchDB.delete(matchId);

    return NextResponse.json({ 
      message: 'Maç başarıyla silindi',
      deletedMatch: match
    });

  } catch (error) {
    console.error('Admin match delete error:', error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
