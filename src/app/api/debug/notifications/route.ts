import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { notificationDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Token kontrolü
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // Kullanıcının tüm bildirimlerini getir
    const notifications = await notificationDB.getByUserId(decoded.id);
    
    // Maç hatırlatma bildirimlerini filtrele
    const matchReminders = notifications.filter(n => n.type === 'match_reminder');

    return NextResponse.json({ 
      allNotifications: notifications,
      matchReminders: matchReminders,
      totalCount: notifications.length,
      matchReminderCount: matchReminders.length
    });

  } catch (error) {
    console.error('Debug notifications error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 