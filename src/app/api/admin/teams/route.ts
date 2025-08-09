import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { teamDB, userDB, playerDB, matchDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get all teams, users, players, and matches
    const [teams, users, players, matches] = await Promise.all([
      teamDB.getAll(),
      userDB.getAll(),
      playerDB.getAll(),
      matchDB.getAll()
    ]);

    // Enrich teams with additional data
    const enrichedTeams = teams.map(team => {
      const creator = users.find(u => u.id === team.created_by);
      const captain = team.captain_id ? users.find(u => u.id === team.captain_id) : null;
      
      // Count real players for this team
      const player_count = players.filter(p => p.team_id === team.id && p.is_active).length;
      
      // Count real matches for this team
      const match_count = matches.filter(m => m.team_id === team.id).length;

      return {
        ...team,
        created_by_name: creator?.full_name || creator?.username,
        captain_name: captain?.full_name || captain?.username,
        player_count,
        match_count
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
