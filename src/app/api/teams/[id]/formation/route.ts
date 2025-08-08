import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { formationDB, positionDB, formationUtils, teamDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const teamId = parseInt(id);

    // Takım formasyonunu getir
    const formation = await formationDB.getByTeamId(teamId);
    const savedPositions = await positionDB.getByTeamId(teamId);

    // Eğer formasyon yoksa varsayılan değerleri kullan
    const teamSize = formation?.team_size || 11;
    let formationName = formation?.formation_name || '3-3-1';
    
    // Eski formasyon adlarını yeni formata çevir
    if (formationName.startsWith('1-')) {
      formationName = formationName.substring(2); // "1-3-3-1" -> "3-3-1"
    }
    
    const positions = formationUtils.calculatePositions(formationName);

    // Kaydedilmiş pozisyonları mevcut pozisyonlarla birleştir
    const positionsWithPlayers = positions.map(pos => {
      const savedPosition = savedPositions.find(sp => sp.position_id === pos.id);
      return {
        ...pos,
        player: savedPosition ? {
          id: savedPosition.player_id,
          user_id: savedPosition.user_id,
          full_name: savedPosition.full_name,
          username: savedPosition.username
        } : null
      };
    });

    return NextResponse.json({
      formation: {
        name: formationName,
        team_size: teamSize
      },
      positions: positionsWithPlayers,
      saved_positions: savedPositions
    });
  } catch (error) {
    console.error('Formasyon getirme hatası:', error);
    return NextResponse.json({ error: 'Formasyon getirilemedi' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const teamId = parseInt(id);
    const body = await request.json();
    const { formation_name, team_size, positions } = body;

    // Takımın var olduğunu ve kullanıcının yetkili olduğunu kontrol et
    const team = await teamDB.getById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Kullanıcının takım sahibi veya kaptan olup olmadığını kontrol et
    const isTeamOwner = team.created_by === decoded.id;
    const isAuthorized = isTeamOwner || team.captain_id === decoded.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Formasyonu kaydet
    const formation = await formationDB.upsert({
      team_id: teamId,
      formation_name,
      team_size
    });

    // Pozisyonları kaydet
    if (positions && positions.length > 0) {
      console.log('Gelen pozisyonlar:', positions); // Debug için
      
      const positionsToSave = positions.map((pos: { player?: { id: number }, id: number, name: string, x: number, y: number }) => ({
        player_id: pos.player?.id,
        position_id: pos.id,
        position_name: pos.name,
        x_coordinate: pos.x,
        y_coordinate: pos.y
      })).filter((pos: { player_id?: number }) => pos.player_id); // Sadece oyuncu atanmış pozisyonları kaydet

      console.log('Kaydedilecek pozisyonlar:', positionsToSave); // Debug için

      if (positionsToSave.length > 0) {
        await positionDB.saveFormation(teamId, positionsToSave);
      } else {
        // Eğer hiç pozisyon yoksa mevcut pozisyonları temizle
        await positionDB.deleteByTeamId(teamId);
      }
    } else {
      // Pozisyon yoksa mevcut pozisyonları temizle
      await positionDB.deleteByTeamId(teamId);
    }

    return NextResponse.json({
      success: true,
      formation,
      message: 'Formasyon ve mevkilendirme kaydedildi'
    });
  } catch (error) {
    console.error('Formasyon kaydetme hatası:', error);
    return NextResponse.json({ error: 'Formasyon kaydedilemedi' }, { status: 500 });
  }
} 