import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { teamDB, userDB, matchDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get teams, users, and matches
    const [teams, users, matches] = await Promise.all([
      teamDB.getAll(),
      userDB.getAll(),
      matchDB.getAll()
    ]);

    // Enrich matches with team and user data
    const enrichedMatches = (matches as any[]).map((match) => {
      const team = (teams as any[]).find((t) => t.id === match.team_id);
      const creator = team ? (users as any[]).find((u) => u.id === team.created_by) : null;

      return {
        id: match.id,
        team_id: match.team_id,
        team_name: team?.name || 'Bilinmeyen Takım',
        opponent_team: match.opponent_team,
        match_date: match.match_date,
        location: match.location,
        status: match.status,
        home_score: match.home_score,
        away_score: match.away_score,
        created_at: match.created_at,
        created_by_name: creator?.full_name || creator?.username || null
      };
    });

    // Sort by match date (newest first)
    const sortedMatches = enrichedMatches.sort((a, b) => 
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
