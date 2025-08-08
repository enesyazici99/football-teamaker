import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

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

    // In a real application, you would delete from the database
    // For now, we'll just return success since this is mock data
    return NextResponse.json({ 
      message: 'Maç başarıyla silindi',
      deletedMatchId: matchId
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
