import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Mock log data for demonstration
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'Kullanıcı Girişi',
        user_id: 1,
        user_name: 'Ahmet Yılmaz',
        details: 'Kullanıcı sisteme başarıyla giriş yaptı',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        level: 'success',
        action: 'Takım Oluşturma',
        user_id: 2,
        user_name: 'Mehmet Demir',
        details: 'Yeni takım "Şampiyonlar" başarıyla oluşturuldu',
        ip_address: '192.168.1.101'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        level: 'warning',
        action: 'Başarısız Giriş Denemesi',
        details: 'Yanlış şifre ile giriş denemesi - 3. deneme',
        ip_address: '192.168.1.102'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        level: 'error',
        action: 'Veritabanı Hatası',
        details: 'Kullanıcı verisi kaydedilirken hata oluştu: Connection timeout',
        ip_address: '192.168.1.103'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        level: 'info',
        action: 'Maç Planlandı',
        user_id: 3,
        user_name: 'Ayşe Kaya',
        details: 'Yeni maç "Şampiyonlar vs Galibiler" planlandı',
        ip_address: '192.168.1.104'
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        level: 'success',
        action: 'Oyuncu Daveti',
        user_id: 1,
        user_name: 'Ahmet Yılmaz',
        details: 'Fatma Şen takıma davet edildi ve daveti kabul etti',
        ip_address: '192.168.1.100'
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        level: 'warning',
        action: 'Takım Boyutu Değişikliği',
        user_id: 2,
        user_name: 'Mehmet Demir',
        details: 'Takım boyutu 11v11 den 7v7 ye değiştirildi',
        ip_address: '192.168.1.101'
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        level: 'error',
        action: 'Admin Panel Erişim Denemesi',
        details: 'Yetkisiz kullanıcı admin paneline erişmeye çalıştı',
        ip_address: '192.168.1.200'
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        level: 'info',
        action: 'Sistem Yedekleme',
        details: 'Günlük sistem yedeklemesi başarıyla tamamlandı',
        ip_address: 'system'
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        level: 'success',
        action: 'Kullanıcı Kaydı',
        details: 'Yeni kullanıcı "emre.ozkan@email.com" başarıyla kaydedildi',
        ip_address: '192.168.1.105'
      }
    ];

    // Sort by timestamp (newest first)
    const sortedLogs = mockLogs.sort((a, b) => 
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
