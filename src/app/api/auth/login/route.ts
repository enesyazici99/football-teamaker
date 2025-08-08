import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { matchDB, notificationDB, playerDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta/kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    // Kullanıcının yarın maçı olup olmadığını kontrol et
    try {
      await checkAndSendMatchReminders(user.id);
    } catch (error) {
      console.error('Match reminder check failed:', error);
      // Maç kontrolü başarısız olsa bile giriş işlemi devam etsin
    }

    const response = NextResponse.json(
      { message: 'Giriş başarılı', user },
      { status: 200 }
    );

    // JWT token'ı cookie olarak ayarla
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 gün
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Maç hatırlatma kontrolü ve bildirim gönderme fonksiyonu
async function checkAndSendMatchReminders(userId: number) {
  try {
    console.log('Checking match reminders for user:', userId);
    
    // Yarın maçı olan takımları bul
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    console.log('Looking for matches between:', tomorrow.toISOString(), 'and', dayAfterTomorrow.toISOString());
    
    // Yarın maçı olan takımları getir
    const upcomingMatches = await matchDB.getMatchesByDateRange(tomorrow.toISOString(), dayAfterTomorrow.toISOString());
    
    console.log('Found upcoming matches:', upcomingMatches.length);
    
    let notificationsSent = 0;
    
    for (const match of upcomingMatches) {
      try {
        // Kullanıcının bu takımda aktif oyuncu olup olmadığını kontrol et
        const players = await playerDB.getByTeamId(match.team_id);
        const userPlayer = players.find(player => player.user_id === userId && player.is_active);
        
        if (userPlayer) {
          // Daha önce bu maç için bildirim gönderilmiş mi kontrol et
          const existingNotification = await notificationDB.getByUserAndType(
            userId, 
            'match_reminder', 
            match.id
          );
          
          if (!existingNotification) {
            // Bildirim oluştur
            await notificationDB.create({
              user_id: userId,
              type: 'match_reminder',
              title: 'Yarın Maçınız Var!',
              message: `Yarın ${match.opponent_team || 'rakip takım'} ile maçınız var. Saat: ${new Date(match.match_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}${match.location ? `, Lokasyon: ${match.location}` : ''}`,
              related_id: match.id
            });
            
            notificationsSent++;
            console.log(`Notification sent to user ${userId} for match ${match.id}`);
          } else {
            console.log(`Notification already sent to user ${userId} for match ${match.id} - skipping`);
          }
        } else {
          console.log(`User ${userId} is not an active player in team ${match.team_id} - skipping`);
        }
      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
      }
    }
    
    console.log(`Match reminder check completed. ${notificationsSent} notifications sent.`);
    
  } catch (error) {
    console.error('Match reminder check error:', error);
    throw error;
  }
} 