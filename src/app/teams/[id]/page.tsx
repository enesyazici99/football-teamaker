'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import SetCaptainModal from '@/components/SetCaptainModal';
import AuthorizedMemberModal from '@/components/AuthorizedMemberModal';

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  authorized_members?: number[];
  team_size: number;
  created_at: string;
}

interface Player {
  id: number;
  user_id: number;
  team_id: number;
  position?: string;
  skill_level: number;
  is_active: boolean;
  joined_at: string;
  full_name: string;
  username: string;
  positions?: string[];
  availability_status?: string;
}

interface Match {
  id: number;
  team_id: number;
  match_date: string;
  location?: string;
  status: string;
  home_score: number;
  away_score: number;
  created_at: string;
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showSetCaptainModal, setShowSetCaptainModal] = useState(false);
  const [showAuthorizedMemberModal, setShowAuthorizedMemberModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId, fetchTeamData]);

  const fetchTeamData = useCallback(async () => {
    try {
      const [teamResponse, playersResponse, matchesResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/players`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/matches`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
      }

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(playersData.players);
      }

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches || []);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      setError('Takım bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id || (team?.authorized_members || []).includes(currentUser?.id || 0);
  const isTeamMember = players.some(player => player.user_id === currentUser?.id && player.is_active);

  const handleTeamSizeChange = async (newSize: number) => {
    if (!team || !isAuthorized) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/team-size`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ team_size: newSize })
      });

      if (response.ok) {
        const result = await response.json();
        setTeam(result.team);
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Takım boyutu başarıyla güncellendi',
          duration: 3000
        });
      } else {
        throw new Error('Takım boyutu güncellenemedi');
      }
    } catch (error) {
      setError('Takım boyutu güncellenemedi');
      (window as any).showToast({
        type: 'error',
        title: 'Hata!',
        message: 'Takım boyutu güncellenemedi',
        duration: 4000
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailabilityStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'unavailable':
        return 'Müsait Değil';
      case 'maybe':
        return 'Belki';
      default:
        return 'Bilinmiyor';
    }
  };

  const getAvailabilityStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPlayerRole = (player: Player) => {
    if (team?.created_by === player.user_id) {
      return 'Takım Sahibi';
    } else if (team?.captain_id === player.user_id) {
      return 'Kaptan';
    } else if (team?.authorized_members?.includes(player.user_id)) {
      return 'Yetkili';
    } else {
      return 'Üye';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Takım Sahibi':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Kaptan':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Yetkili':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Üye':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Badge variant="destructive" className="mb-4">
            Takım bulunamadı
          </Badge>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </div>
    );
  }

  // Kullanıcının takımda oyuncu olup olmadığını kontrol et
  if (!isTeamOwner && !isAuthorized && !isTeamMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Badge variant="destructive" className="mb-4">
            Bu takıma erişim yetkiniz yok
          </Badge>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
                {team.description && (
                  <p className="text-lg text-muted-foreground mt-2">{team.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-4">
                  {isTeamOwner && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Takım Sahibi
                    </Badge>
                  )}
                  {team.captain_id === currentUser?.id && !isTeamOwner && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Kaptan
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Takım Boyutu:
                  </Badge>
                  {isAuthorized ? (
                    <select
                      value={team.team_size}
                      onChange={(e) => handleTeamSizeChange(parseInt(e.target.value))}
                      disabled={isUpdating}
                      className="border border-border bg-background rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {[6, 7, 8, 9, 10, 11].map((size) => (
                        <option key={size} value={size}>
                          {size} Kişilik
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant="secondary">
                      {team.team_size} Kişilik
                    </Badge>
                  )}
                </div>
              </div>
              {isAuthorized && (
                <Button
                  onClick={() => setShowSetCaptainModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Kaptan Belirle
                </Button>
              )}
              {isTeamOwner && (
                <Button
                  onClick={() => setShowAuthorizedMemberModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Yetkili Üye Yönetimi
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Badge variant="destructive" className="w-full justify-center">
                {error}
              </Badge>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Oyuncular */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Oyuncular ({players.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Takım üyeleri ve rolleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-foreground">{player.full_name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            @{player.username}
                          </Badge>
                          <Badge className={`text-xs ${getRoleColor(getPlayerRole(player))}`}>
                            {getPlayerRole(player)}
                          </Badge>
                          {player.position && (
                            <Badge variant="secondary" className="text-xs">
                              {player.position}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getAvailabilityStatusColor(player.availability_status || 'unknown')}`}>
                          {getAvailabilityStatusText(player.availability_status || 'unknown')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {player.skill_level}/10
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maçlar */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Son Maçlar ({matches.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Takımın son maçları ve sonuçları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.length === 0 ? (
                    <div className="text-center py-8">
                      <Badge variant="outline" className="text-muted-foreground">
                        Henüz maç bulunmuyor
                      </Badge>
                    </div>
                  ) : (
                    matches.slice(0, 5).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(match.match_date).toLocaleDateString('tr-TR')}
                          </Badge>
                          {match.location && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {match.location}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {match.home_score} - {match.away_score}
                          </Badge>
                          <Badge 
                            className={`text-xs ${
                              match.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : match.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {match.status === 'completed' ? 'Tamamlandı' : match.status === 'scheduled' ? 'Planlandı' : 'İptal'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {showSetCaptainModal && team && (
        <SetCaptainModal
          isOpen={showSetCaptainModal}
          onClose={() => setShowSetCaptainModal(false)}
          teamId={team.id}
          teamName={team.name}
          currentCaptainId={team.captain_id}
        />
      )}
      
      {showAuthorizedMemberModal && team && (
        <AuthorizedMemberModal
          isOpen={showAuthorizedMemberModal}
          onClose={() => setShowAuthorizedMemberModal(false)}
          teamId={team.id}
          teamName={team.name}
          currentAuthorizedMembers={team.authorized_members || []}
        />
      )}
    </div>
  );
} 
