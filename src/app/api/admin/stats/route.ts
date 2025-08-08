import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { userDB, teamDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get all stats in parallel
    const [users, teams] = await Promise.all([
      userDB.getAll(),
      teamDB.getAll()
    ]);

    // Calculate stats
    const totalUsers = users.length;
    const totalTeams = teams.length;
    
    // Active users (users who have created or joined teams)
    const activeUsers = users.filter(user => 
      teams.some(team => team.created_by === user.id)
    ).length;

    // Get matches count (mock for now since we don't have matches in simple DB)
    const totalMatches = 150; // This would be actual count from matches table
    const todayMatches = 5; // Today's matches count
    const totalLogs = 1250; // This would be from logs table

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
