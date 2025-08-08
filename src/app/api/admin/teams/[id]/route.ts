import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { teamDB } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin authentication required
    requireAdmin(request);

    const { id } = await params;
    const teamId = parseInt(id);
    
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Geçersiz takım ID' },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Takım bulunamadı' },
        { status: 404 }
      );
    }

    // Delete team (this will also cascade delete related data)
    await teamDB.delete(teamId);

    return NextResponse.json({ 
      message: 'Takım başarıyla silindi',
      deletedTeam: team
    });

  } catch (error) {
    console.error('Admin team delete error:', error);
    
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
