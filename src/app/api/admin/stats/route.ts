import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { userDB, teamDB, matchDB, notificationDB, playerDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get all stats in parallel
    const [users, teams, matches, notifications, players] = await Promise.all([
      userDB.getAll(),
      teamDB.getAll(),
      matchDB.getAll(),
      notificationDB.getAll(),
      playerDB.getAll()
    ]);

    // Calculate stats
    const totalUsers = users.length;
    const totalTeams = teams.length;
    const totalMatches = matches.length;
    
    // Active users (users who have created teams or are players in teams)
    const activeUserIds = new Set<number>();
    teams.forEach((team: { created_by: number; }) => {
      if (team.created_by) activeUserIds.add(team.created_by);
    });
    players.forEach((player: { user_id: number; }) => {
      if (player.user_id) activeUserIds.add(player.user_id);
    });
    const activeUsers = activeUserIds.size;

    // Today's matches count
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayMatches = matches.filter((match: { match_date: string; }) => {
      const matchDate = new Date(match.match_date);
      return matchDate >= todayStart && matchDate < todayEnd;
    }).length;

    // Total notifications/logs count
    const totalLogs = notifications.length;

    const stats = {
      totalUsers,
      totalTeams,
      totalMatches,
      activeUsers,
      todayMatches,
      totalLogs
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Admin stats error:', error);
    
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
