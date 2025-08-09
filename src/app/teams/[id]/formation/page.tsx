'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import TeamNavigation from '@/components/TeamNavigation';

interface Player {
  id: number; // players tablosundaki id
  user_id: number;
  team_id: number;
  position?: string;
  skill_level: number;
  is_active: boolean;
  created_at: string;
  full_name: string;
  username: string;
  positions?: string[];
  availability_status?: string;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  team_size: number;
  created_at: string;
}

interface Position {
  id: string;
  name: string;
  x: number;
  y: number;
  player?: Player;
}



interface FormationOption {
  name: string;
  description: string;
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

// Formasyon yardımcı fonksiyonları
const getAvailableFormations = (teamSize: number): FormationOption[] => {
  switch (teamSize) {
    case 6:
      return [
        { name: '3-1-1', description: '3 Defans, 1 Orta Saha, 1 Forvet' },
        { name: '2-2-1', description: '2 Defans, 2 Orta Saha, 1 Forvet' },
        { name: '3-2', description: '3 Defans, 2 Orta Saha' }
      ];
    case 7:
      return [
        { name: '3-2-1', description: '3 Defans, 2 Orta Saha, 1 Forvet' },
        { name: '2-3-1', description: '2 Defans, 3 Orta Saha, 1 Forvet' },
        { name: '3-3', description: '3 Defans, 3 Orta Saha' }
      ];
    case 8:
      return [
        { name: '3-3-1', description: '3 Defans, 3 Orta Saha, 1 Forvet' },
        { name: '2-4-1', description: '2 Defans, 4 Orta Saha, 1 Forvet' },
        { name: '3-4', description: '3 Defans, 4 Orta Saha' }
      ];
    case 9:
      return [
        { name: '3-4-1', description: '3 Defans, 4 Orta Saha, 1 Forvet' },
        { name: '2-5-1', description: '2 Defans, 5 Orta Saha, 1 Forvet' },
        { name: '3-5', description: '3 Defans, 5 Orta Saha' }
      ];
    case 10:
      return [
        { name: '3-5-1', description: '3 Defans, 5 Orta Saha, 1 Forvet' },
        { name: '2-6-1', description: '2 Defans, 6 Orta Saha, 1 Forvet' },
        { name: '3-6', description: '3 Defans, 6 Orta Saha' }
      ];
    case 11:
      return [
        { name: '3-6-1', description: '3 Defans, 6 Orta Saha, 1 Forvet' },
        { name: '2-7-1', description: '2 Defans, 7 Orta Saha, 1 Forvet' },
        { name: '3-7', description: '3 Defans, 7 Orta Saha' }
      ];
    default:
      return [
        { name: '3-3-1', description: '3 Defans, 3 Orta Saha, 1 Forvet' }
      ];
  }
};

const calculatePositions = (formationName: string): Array<{ id: string; name: string; x: number; y: number }> => {
  const positions: Array<{ id: string; name: string; x: number; y: number }> = [];
  
  // Kaleci - her zaman sabit
  positions.push({ id: 'gk', name: 'Kaleci', x: 50, y: 92 });
  
  // Formasyon adını parçala (örn: "3-3-1" -> [3, 3, 1])
  const formationParts = formationName.split('-').map(Number);
  
  if (formationParts.length === 3) {
    // 3 parçalı formasyon: 3-3-1 gibi (defans, orta saha, forvet)
    const [def, mid, fwd] = formationParts;
    
    // Defans pozisyonları
    if (def === 2) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    } else if (def === 3) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'cb', name: 'Stoper', x: 50, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    }
    
    // Orta saha pozisyonları
    if (mid === 1) {
      positions.push({ id: 'cm', name: 'Orta Saha', x: 50, y: 50 });
    } else if (mid === 2) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 30, y: 50 });
    } else if (mid === 3) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 20, y: 50 });
    } else if (mid === 4) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 85, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 15, y: 50 });
    } else if (mid === 5) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 30, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 6) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 75, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 25, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 7) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 95, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 65, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 35, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 20, y: 50 });
      positions.push({ id: 'cm7', name: 'Orta Saha', x: 5, y: 50 });
    }
    
    // Forvet pozisyonları
    if (fwd === 1) {
      positions.push({ id: 'st', name: 'Forvet', x: 50, y: 25 });
    }
  } else if (formationParts.length === 2) {
    // 2 parçalı formasyon: 3-3 gibi (defans, orta saha)
    const [def, mid] = formationParts;
    
    // Defans pozisyonları
    if (def === 2) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    } else if (def === 3) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'cb', name: 'Stoper', x: 50, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    }
    
    // Orta saha pozisyonları
    if (mid === 1) {
      positions.push({ id: 'cm', name: 'Orta Saha', x: 50, y: 50 });
    } else if (mid === 2) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 30, y: 50 });
    } else if (mid === 3) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 20, y: 50 });
    } else if (mid === 4) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 85, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 15, y: 50 });
    } else if (mid === 5) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 30, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 6) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 75, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 25, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 7) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 95, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 65, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 35, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 20, y: 50 });
      positions.push({ id: 'cm7', name: 'Orta Saha', x: 5, y: 50 });
    }
  }
  
  return positions;
};

export default function TeamFormationPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [_availableFormations, setAvailableFormations] = useState<FormationOption[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const fetchTeamData = useCallback(async () => {
    try {
      const [teamResponse, playersResponse, formationResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/players`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/formation`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
        
        // Takım boyutuna göre mevcut formasyonları al
        const formations = getAvailableFormations(teamData.team.team_size);
        setAvailableFormations(formations);
      }

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(playersData.players);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }

      if (formationResponse.ok) {
        const formationData = await formationResponse.json();
        console.log('Formasyon verisi:', formationData); // Debug için
        
        setSelectedFormation(formationData.formation.name);
        
        // Pozisyonları ayarla
        const calculatedPositions = calculatePositions(formationData.formation.name);
        const positionsWithPlayers = calculatedPositions.map(pos => {
          const savedPosition = formationData.positions.find((sp: { id: string, player?: Player }) => sp.id === pos.id);
          return {
            ...pos,
            player: savedPosition?.player || null
          };
        });
        
        console.log('Hesaplanan pozisyonlar:', calculatedPositions); // Debug için
        console.log('Oyuncularla pozisyonlar:', positionsWithPlayers); // Debug için
        
        setPositions(positionsWithPlayers);
      } else {
        // Formasyon yoksa varsayılan pozisyonları ayarla
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const formations = getAvailableFormations(teamData.team.team_size);
          if (formations.length > 0) {
            const defaultFormation = formations[0].name;
            setSelectedFormation(defaultFormation);
            const calculatedPositions = calculatePositions(defaultFormation);
            setPositions(calculatedPositions);
          }
        }
      }
    } catch (error) {
      console.error('Takım bilgileri yüklenemedi:', error);
      setError('Takım bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId, fetchTeamData]);

  // Formasyon değiştiğinde pozisyonları güncelle
  useEffect(() => {
    if (selectedFormation && !isLoading) {
      const newPositions = calculatePositions(selectedFormation);
      // Mevcut oyuncuları koru
      setPositions(prevPositions => {
        return newPositions.map(newPos => {
          const existingPos = prevPositions.find(p => p.id === newPos.id);
          return {
            ...newPos,
            player: existingPos?.player
          };
        });
      });
    }
  }, [selectedFormation, isLoading]);

  const handlePositionClick = (position: Position) => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || (team?.captain_id === currentUser?.id);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Pozisyon değiştirmek için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    if (selectedPlayer) {
      // Oyuncuyu pozisyona yerleştir
      const updatedPositions = positions.map(pos => 
        pos.id === position.id 
          ? { ...pos, player: selectedPlayer }
          : pos.player?.id === selectedPlayer.id 
            ? { ...pos, player: undefined }
            : pos
      );
      setPositions(updatedPositions);
      setSelectedPlayer(null);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || (team?.captain_id === currentUser?.id);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Oyuncu seçmek için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    setSelectedPlayer(player);
  };

  const handleFormationChange = (formationName: string) => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || (team?.captain_id === currentUser?.id);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Formasyon değiştirmek için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    setSelectedFormation(formationName);
  };

  const handleSaveFormation = async () => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || (team?.captain_id === currentUser?.id);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Bu işlem için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    setIsSaving(true);
    try {
      // Sadece oyuncu atanmış pozisyonları filtrele
      const positionsWithPlayers = positions.filter(pos => pos.player);
      
      console.log('Kaydedilecek pozisyonlar:', positionsWithPlayers); // Debug için
      
      const response = await fetch(`/api/teams/${teamId}/formation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          formation_name: selectedFormation,
          team_size: team?.team_size || 11,
          positions: positionsWithPlayers
        })
      });

      if (response.ok) {
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Formasyon ve mevkilendirme başarıyla kaydedildi',
          duration: 3000
        });
        // Sayfayı yenile
        fetchTeamData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Formasyon kaydedilemedi');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Formasyon kaydedilemedi';
      setError(errorMessage);
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata!',
        message: `Formasyon kaydedilemedi: ${errorMessage}`,
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Takım bulunamadı</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </div>
    );
  }

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id;
  const isTeamMember = players.some(player => player.user_id === currentUser?.id && player.is_active);
  
  // Debug için
  console.log('Yetki Kontrolü:', {
    teamId: team?.id,
    teamOwnerId: team?.created_by,
    teamCaptainId: team?.captain_id,
    currentUserId: currentUser?.id,
    isTeamOwner,
    isAuthorized,
    isTeamMember
  });

  // Kullanıcının takımda oyuncu olup olmadığını kontrol et
  if (!isTeamOwner && !isAuthorized && !isTeamMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Bu takıma erişim yetkiniz yok</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team.name} isAuthorized={isAuthorized} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{team.name} - Mevkilendirme</h1>
                {team.description && (
                  <p className="text-lg text-muted-foreground mt-2">{team.description}</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Badge variant="destructive" className="w-full justify-center">
                {error}
              </Badge>
            </div>
          )}

          {/* Navigation */}
          <TeamNavigation teamId={teamId} isAuthorized={isAuthorized} />

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formasyon Seçimi ve Saha */}
            <div className="space-y-6">
              {/* Formasyon Seçimi */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Formasyon Seçimi
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {isAuthorized 
                      ? 'Takım boyutuna uygun formasyon seçin'
                      : 'Sadece yetkili kişiler formasyon değiştirebilir'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {getAvailableFormations(team.team_size).map((formation) => (
                      <Button
                        key={formation.name}
                        variant={selectedFormation === formation.name ? "default" : "outline"}
                        onClick={() => handleFormationChange(formation.name)}
                        disabled={!isAuthorized}
                        className="text-sm"
                      >
                        <div className="text-center">
                          <div className="font-semibold">{formation.name}</div>
                          <div className="text-xs opacity-75">{formation.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Saha */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Saha Dizilimi
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedPlayer 
                      ? `${selectedPlayer.full_name} için pozisyon seçin`
                      : 'Oyuncu seçmek için aşağıdaki listeden bir oyuncuya tıklayın'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-green-600 rounded-lg p-4 h-96">
                    {/* Saha çizgileri */}
                    <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
                    
                    {/* Orta saha çizgisi (yatay) */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white"></div>
                    
                    {/* Orta saha yuvarlağı */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Orta nokta */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Sol kale (üst kale) */}
                    <div className="absolute top-4 left-1/2 w-8 h-2 bg-white transform -translate-x-1/2"></div>
                    <div className="absolute top-2 left-1/2 w-12 h-4 border-2 border-white transform -translate-x-1/2"></div>
                    
                    {/* Sağ kale (alt kale) */}
                    <div className="absolute bottom-4 left-1/2 w-8 h-2 bg-white transform -translate-x-1/2"></div>
                    <div className="absolute bottom-2 left-1/2 w-12 h-4 border-2 border-white transform -translate-x-1/2"></div>
                    
                    {/* Üst ceza sahası */}
                    <div className="absolute top-4 left-1/4 w-1/2 h-8 border-b-2 border-white"></div>
                    
                    {/* Alt ceza sahası */}
                    <div className="absolute bottom-4 left-1/4 w-1/2 h-8 border-t-2 border-white"></div>
                    
                    {/* Üst ceza noktası */}
                    <div className="absolute top-12 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2"></div>
                    
                    {/* Alt ceza noktası */}
                    <div className="absolute bottom-12 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2"></div>
                    
                    {/* Pozisyonlar */}
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        onClick={() => handlePositionClick(position)}
                        className={`absolute w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                          position.player
                            ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        } ${isAuthorized ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-75'}`}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {position.player ? (
                          <div className="text-center">
                            <div className="text-xs font-bold truncate max-w-12">
                              {position.player.full_name.split(' ')[0]}
                            </div>
                            <div className="text-xs opacity-75">{position.name}</div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-xs font-bold">{position.name}</div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Takım boyutu bilgisi */}
                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                      {team.team_size} Kişilik Takım
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Oyuncu Listesi ve Kaydet Butonu */}
            <div className="space-y-6">
              {/* Oyuncu Listesi */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Oyuncular ({players.length})
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedPlayer ? 'Pozisyona yerleştirmek için sahada bir pozisyona tıklayın' : 'Oyuncu seçin'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players.map((player) => {
                      // Oyuncunun sahada olup olmadığını kontrol et
                      const isPlayerOnField = positions.some(pos => pos.player?.id === player.id);
                      
                      return (
                        <div
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          className={`p-3 rounded-lg transition-colors border-2 ${
                            selectedPlayer?.id === player.id
                              ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400'
                              : isPlayerOnField
                                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                                : 'bg-muted/50 border-transparent hover:bg-muted'
                          } ${isAuthorized ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{player.full_name}</p>
                                {isPlayerOnField && (
                                  <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                                    Sahada
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                @{player.username}
                              </Badge>
                              {isPlayerOnField && (
                                <p className="text-xs text-green-600 font-medium dark:text-green-400 mt-1">
                                  Pozisyon: {positions.find(pos => pos.player?.id === player.id)?.name}
                                </p>
                              )}
                              {player.positions && player.positions.length > 0 && (
                                <p className="text-xs text-muted-foreground">Tercih: {player.positions.join(', ')}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {player.skill_level}/10
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Kaydet Butonu */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Kaydet
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {isAuthorized 
                      ? 'Formasyon ve mevkilendirmeyi kaydetmek için butona tıklayın'
                      : 'Sadece yetkili kişiler formasyon kaydedebilir'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSaveFormation}
                    disabled={isSaving || !isAuthorized}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-muted"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Formasyonu Kaydet'}
                  </Button>
                  {!isAuthorized && (
                    <Badge variant="outline" className="text-xs mt-2 w-full justify-center">
                      Bu işlem için yetkiniz bulunmuyor
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}