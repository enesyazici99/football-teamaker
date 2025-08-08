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

    // Kullanıcının bildirimlerini getir
    const notifications = await notificationDB.getByUserId(decoded.id);

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, notification_id } = body; // action: 'mark_read' veya 'mark_all_read'

    if (action === 'mark_all_read') {
      await notificationDB.markAllAsRead(decoded.id);
      return NextResponse.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
    }

    if (action === 'mark_read' && notification_id) {
      const notification = await notificationDB.markAsRead(notification_id);
      if (!notification) {
        return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Bildirim okundu olarak işaretlendi' });
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 