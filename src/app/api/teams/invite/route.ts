import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { teamInvitationDB, userDB, teamDB, notificationDB } from '@/lib/db';
import { z } from 'zod';

const inviteSchema = z.object({
  team_id: z.number(),
  invited_user_id: z.number(),
  message: z.string().optional(),
});

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
    const { team_id, invited_user_id, message } = inviteSchema.parse(body);

    // Takımın var olduğunu ve kullanıcının takım sahibi olduğunu kontrol et
    const team = await teamDB.getById(team_id);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    if (team.created_by !== decoded.id) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Davet edilecek kullanıcının var olduğunu kontrol et
    const invitedUser = await userDB.getById(invited_user_id);
    if (!invitedUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Zaten davet var mı kontrol et
    const existingInvitations = await teamInvitationDB.getByUserId(invited_user_id);
    const alreadyInvited = existingInvitations.some(inv => inv.team_id === team_id && inv.status === 'pending');
    
    if (alreadyInvited) {
      return NextResponse.json({ error: 'Bu kullanıcı zaten davet edilmiş' }, { status: 400 });
    }

    // Davet oluştur
    const invitation = await teamInvitationDB.create({
      team_id,
      invited_user_id,
      invited_by: decoded.id,
      message
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Davet oluşturulamadı' }, { status: 500 });
    }

    // Bildirim oluştur
    await notificationDB.create({
      user_id: invited_user_id,
      type: 'team_invitation',
      title: 'Yeni Takım Daveti',
      message: `${team.name} takımından davet aldınız.`,
      related_id: team_id
    });

    return NextResponse.json({ 
      message: 'Davet başarıyla gönderildi', 
      invitation 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Team invite error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 