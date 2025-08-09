import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { notificationDB, userDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get notifications and users for enriching log data
    const [notifications, users] = await Promise.all([
      notificationDB.getAll(),
      userDB.getAll()
    ]);

    // Convert notifications to log format
    const logs = notifications.map((notification: any) => {
      const user = users.find((u: any) => u.id === notification.user_id);
      
      // Map notification types to log levels and actions
      let level = 'info';
      let action = notification.type;
      
      switch (notification.type) {
        case 'team_invitation':
          level = 'info';
          action = 'Takım Daveti';
          break;
        case 'match_reminder':
          level = 'warning';
          action = 'Maç Hatırlatması';
          break;
        case 'team_created':
          level = 'success';
          action = 'Takım Oluşturma';
          break;
        case 'player_joined':
          level = 'success';
          action = 'Oyuncu Katılımı';
          break;
        case 'match_created':
          level = 'info';
          action = 'Maç Planlandı';
          break;
        default:
          level = 'info';
          action = notification.type || 'Sistem Bildirimi';
      }

      return {
        id: notification.id,
        timestamp: notification.created_at,
        level,
        action,
        user_id: notification.user_id,
        user_name: user?.full_name || user?.username || null,
        details: notification.message,
        ip_address: null, // Not stored in notifications
        user_agent: null  // Not stored in notifications
      };
    });

    // Sort by timestamp (newest first)
    const sortedLogs = logs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ logs: sortedLogs });

  } catch (error) {
    console.error('Admin logs fetch error:', error);
    
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
