import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamInvitationDB, playerDB, notificationDB } from '@/lib/db';

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

    // Kullanıcının davetlerini getir
    const invitations = await teamInvitationDB.getByUserId(decoded.id);

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Get invitations error:', error);
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
    const { invitation_id, action } = body; // action: 'accept' veya 'reject'

    if (!invitation_id || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Geçersiz parametreler' }, { status: 400 });
    }

    // Daveti getir
    const invitation = await teamInvitationDB.getById(invitation_id);
    if (!invitation) {
      return NextResponse.json({ error: 'Davet bulunamadı' }, { status: 404 });
    }

    if (invitation.invited_user_id !== decoded.id) {
      return NextResponse.json({ error: 'Bu davet size ait değil' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Bu davet zaten yanıtlanmış' }, { status: 400 });
    }

    // Daveti güncelle
    const updatedInvitation = await teamInvitationDB.updateStatus(invitation_id, action);

    if (action === 'accept') {
      // Oyuncuyu takıma ekle
      await playerDB.create({
        user_id: decoded.id,
        team_id: invitation.team_id,
        position: undefined, // Varsayılan pozisyon
        skill_level: 5,
        joined_at: new Date().toISOString() // Katılma tarihini ekle
      });

      // Bildirim oluştur
      await notificationDB.create({
        user_id: invitation.invited_by,
        type: 'invitation_accepted',
        title: 'Davet Kabul Edildi',
        message: `${decoded.username} takım davetinizi kabul etti.`,
        related_id: invitation.team_id
      });
    } else {
      // Bildirim oluştur
      await notificationDB.create({
        user_id: invitation.invited_by,
        type: 'invitation_rejected',
        title: 'Davet Reddedildi',
        message: `${decoded.username} takım davetinizi reddetti.`,
        related_id: invitation.team_id
      });
    }

    return NextResponse.json({ 
      message: `Davet ${action === 'accept' ? 'kabul edildi' : 'reddedildi'}`, 
      invitation: updatedInvitation 
    });

  } catch (error) {
    console.error('Respond to invitation error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 