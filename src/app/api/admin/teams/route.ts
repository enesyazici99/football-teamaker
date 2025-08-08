import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { teamDB, userDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get all teams and users
    const [teams, users] = await Promise.all([
      teamDB.getAll(),
      userDB.getAll()
    ]);

    // Enrich teams with additional data
    const enrichedTeams = teams.map(team => {
      const creator = users.find(u => u.id === team.created_by);
      const captain = team.captain_id ? users.find(u => u.id === team.captain_id) : null;

      return {
        ...team,
        created_by_name: creator?.full_name || creator?.username,
        captain_name: captain?.full_name || captain?.username,
        player_count: Math.floor(Math.random() * team.team_size) + 1, // Mock data
        match_count: Math.floor(Math.random() * 20) // Mock data
      };
    });

    return NextResponse.json({ teams: enrichedTeams });

  } catch (error) {
    console.error('Admin teams fetch error:', error);
    
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
