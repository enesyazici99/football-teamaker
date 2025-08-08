import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { teamDB, userDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get teams and users for enriching match data
    const [teams, users] = await Promise.all([
      teamDB.getAll(),
      userDB.getAll()
    ]);

    // Mock match data for demonstration
    const mockMatches = [
      {
        id: 1,
        team_id: teams[0]?.id || 1,
        team_name: teams[0]?.name || 'Şampiyonlar',
        opponent_team: 'Galibiler',
        match_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Merkez Spor Kompleksi',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: users[0]?.full_name || 'Ahmet Yılmaz'
      },
      {
        id: 2,
        team_id: teams[1]?.id || 2,
        team_name: teams[1]?.name || 'Aslanlar',
        opponent_team: 'Kaplanlar',
        match_date: new Date().toISOString(),
        location: 'Doğu Halısaha',
        status: 'ongoing',
        home_score: 2,
        away_score: 1,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: users[1]?.full_name || 'Mehmet Demir'
      },
      {
        id: 3,
        team_id: teams[0]?.id || 1,
        team_name: teams[0]?.name || 'Şampiyonlar',
        opponent_team: 'Yıldızlar',
        match_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Batı Spor Merkezi',
        status: 'completed',
        home_score: 3,
        away_score: 2,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: users[0]?.full_name || 'Ahmet Yılmaz'
      },
      {
        id: 4,
        team_id: teams[2]?.id || 3,
        team_name: teams[2]?.name || 'Fırtınalar',
        opponent_team: 'Şimşekler',
        match_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Güney Halısaha',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: users[2]?.full_name || 'Ayşe Kaya'
      },
      {
        id: 5,
        team_id: teams[1]?.id || 2,
        team_name: teams[1]?.name || 'Aslanlar',
        opponent_team: 'Parslar',
        match_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Kuzey Spor Kompleksi',
        status: 'cancelled',
        home_score: 0,
        away_score: 0,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: users[1]?.full_name || 'Mehmet Demir'
      }
    ];

    // Sort by match date (newest first)
    const sortedMatches = mockMatches.sort((a, b) => 
      new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    );

    return NextResponse.json({ matches: sortedMatches });

  } catch (error) {
    console.error('Admin matches fetch error:', error);
    
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
