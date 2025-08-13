'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import InvitePlayerModal from '@/components/InvitePlayerModal';
import ConfirmModal from '@/components/ConfirmModal';
import TeamSelectionModal from '@/components/TeamSelectionModal';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  positions?: string[];
  availability_status?: string;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  created_at: string;
}

interface Match {
  id: number;
  team_id: number;
  match_date: string;
  location?: string;
  opponent_team?: string;
  status: string;
  home_score: number;
  away_score: number;
  created_at: string;
  team_name?: string;
}

interface Player {
  id: number;
  user_id: number;
  team_id: number;
  full_name: string;
  username: string;
}

interface UnratedMatch extends Match {
  playerRatingsGiven?: number;
  totalPlayersToRate?: number;
  currentPlayerId?: number;
}



interface TeamInvitation {
  id: number;
  team_id: number;
  invited_user_id: number;
  invited_by: number;
  status: string;
  message?: string;
  created_at: string;
  team_name: string;
  invited_by_name: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [unratedMatches, setUnratedMatches] = useState<UnratedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [teamToLeave, setTeamToLeave] = useState<number | null>(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedPage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }
        const userData = await response.json();
        setUser(userData.user);
        
        // Kullanıcının takımlarını ve davetlerini yükle
        await fetchTeams();
        await Promise.all([
          fetchInvitations(),
          fetchUpcomingMatches(),
          fetchUnratedMatches(userData.user.id)
        ]);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const userTeams = data.teams || [];
        setTeams(userTeams);
        return userTeams;
      }
    } catch {
      console.error('Teams fetch failed');
    }
    return [];
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/teams/invitations', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const fetchUpcomingMatches = async () => {
    try {
      const response = await fetch('/api/matches/upcoming', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUpcomingMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming matches:', error);
    }
  };

  const fetchUnratedMatches = async (userId: number) => {
    try {
      // Kullanıcının takımlarındaki tamamlanmış maçları al
      const completedMatches: UnratedMatch[] = [];
      const userTeams = teams.length > 0 ? teams : await fetchTeams();
      
      for (const team of userTeams) {
        // Takımın maçlarını al
        const matchesResponse = await fetch(`/api/teams/${team.id}/matches`, { credentials: 'include' });
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          const teamMatches = matchesData.matches || [];
          
          // Tamamlanmış maçları filtrele
          const now = new Date();
          const completed = teamMatches.filter((match: Match) => {
            const matchDate = new Date(match.match_date);
            const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000)); // 2 saat sonra
            return matchEndTime < now || match.status === 'completed';
          });
          
          // Her maç için puanlama durumunu kontrol et
          for (const match of completed) {
            // Kullanıcının bu takımdaki player ID'sini bul
            const playersResponse = await fetch(`/api/teams/${team.id}/players`, { credentials: 'include' });
            if (playersResponse.ok) {
              const playersData = await playersResponse.json();
              const currentPlayer = playersData.players?.find((p: Player) => p.user_id === userId);
              
              if (currentPlayer) {
                // Bu maçtaki puanlamaları kontrol et
                const ratingsResponse = await fetch(`/api/matches/${match.id}/ratings`, { credentials: 'include' });
                if (ratingsResponse.ok) {
                  const ratingsData = await ratingsResponse.json();
                  const myRatings = ratingsData.ratings?.filter((r: any) => r.rater_player_id === currentPlayer.id) || [];
                  const otherPlayers = playersData.players?.filter((p: Player) => p.id !== currentPlayer.id) || [];
                  
                  // Eğer tüm oyuncuları puanlamadıysa, bu maçı listeye ekle
                  if (myRatings.length < otherPlayers.length) {
                    completedMatches.push({
                      ...match,
                      team_name: team.name,
                      playerRatingsGiven: myRatings.length,
                      totalPlayersToRate: otherPlayers.length,
                      currentPlayerId: currentPlayer.id
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      setUnratedMatches(completedMatches);
    } catch (error) {
      console.error('Failed to fetch unrated matches:', error);
    }
  };

  const handleInvitePlayer = (team: Team) => {
    setSelectedTeam(team);
    setShowInviteModal(true);
  };

  const handleLeaveTeam = async (teamId: number) => {
    setTeamToLeave(teamId);
    setShowLeaveConfirm(true);
  };

  const confirmLeaveTeam = async () => {
    if (!teamToLeave) return;

    try {
      const response = await fetch('/api/teams/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          team_id: teamToLeave,
        }),
      });

      if (response.ok) {
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı',
          message: 'Takımdan başarıyla ayrıldınız',
          duration: 3000
        });
        // Takımları yeniden yükle
        await fetchTeams();
      } else {
        const data = await response.json();
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'error',
          title: 'Hata',
          message: data.error || 'Takımdan ayrılma işlemi başarısız',
          duration: 4000
        });
      }
    } catch (_error) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata',
        message: 'Takımdan ayrılma işlemi başarısız',
        duration: 4000
      });
    } finally {
      setTeamToLeave(null);
      setShowLeaveConfirm(false);
    }
  };

  const handleInvitationResponse = async (invitationId: number, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/teams/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          invitation_id: invitationId,
          action: action,
        }),
      });

      if (response.ok) {
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı',
          message: action === 'accept' ? 'Davet kabul edildi' : 'Davet reddedildi',
          duration: 3000
        });
        // Davetleri ve takımları yeniden yükle
        await Promise.all([fetchInvitations(), fetchTeams()]);
      } else {
        const data = await response.json();
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'error',
          title: 'Hata',
          message: data.error || 'İşlem başarısız',
          duration: 4000
        });
      }
    } catch {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata',
        message: 'İşlem başarısız',
        duration: 4000
      });
    }
  };



  const handleTeamSelect = (teamId: number) => {
    switch (selectedPage) {
      case 'players':
        router.push(`/teams/${teamId}/players`);
        break;
      case 'matches':
        router.push(`/teams/${teamId}/matches`);
        break;
      case 'formation':
        router.push(`/teams/${teamId}/formation`);
        break;
      case 'stats':
        router.push(`/teams/${teamId}/stats`);
        break;
      default:
        break;
    }
  };

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = (team: Team) => team.created_by === user?.id;
  const isAuthorized = (team: Team) => isTeamOwner(team) || team.captain_id === user?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Ana İçerik */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Takımlar */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Takımlarım ({teams.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sahip olduğunuz ve üye olduğunuz takımlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {teams.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚽</span>
                      </div>
                      <p className="text-lg font-medium mb-4 text-foreground">Henüz takımınız yok.</p>
                      <Button
                        onClick={() => router.push('/teams/create')}
                        className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                      >
                        İlk Takımınızı Oluşturun
                      </Button>
                    </div>
                  ) : (
                    teams.map((team) => (
                      <div key={team.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{team.name}</h3>
                            {team.description && (
                              <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {isTeamOwner(team) && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Takım Sahibi
                              </Badge>
                            )}
                            {team.captain_id === user?.id && !isTeamOwner(team) && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Kaptan
                              </Badge>
                            )}
                            {!isTeamOwner(team) && team.captain_id !== user?.id && (
                              <Badge variant="secondary">
                                Üye
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => router.push(`/teams/${team.id}`)}
                            size="sm"
                            variant="outline"
                          >
                            Görüntüle
                          </Button>
                          {isAuthorized(team) && (
                            <Button
                              onClick={() => handleInvitePlayer(team)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Oyuncu Davet Et
                            </Button>
                          )}
                          {!isTeamOwner(team) && (
                            <Button
                              onClick={() => handleLeaveTeam(team.id)}
                              size="sm"
                              variant="destructive"
                            >
                              Ayrıl
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Değerlendirme Bekleyen Maçlar */}
            {unratedMatches.length > 0 && (
              <Card className="card-dark border-orange-500/50">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    ⭐ Değerlendirme Bekleyen Maçlar
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Maç sonlandı! Takım arkadaşlarınızın performanslarını değerlendirin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {unratedMatches.map((match) => (
                      <div key={match.id} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-300 dark:border-orange-700">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {match.team_name} vs {match.opponent_team || 'Rakip Takım'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(match.match_date).toLocaleDateString('tr-TR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <Badge variant="outline" className="mt-2 border-orange-500 text-orange-700 dark:text-orange-300">
                              {match.playerRatingsGiven}/{match.totalPlayersToRate} oyuncu puanlandı
                            </Badge>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-2">
                              Maç Tamamlandı
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              Skor: {match.home_score} - {match.away_score}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push(`/teams/${match.team_id}/matches/${match.id}`)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Oyuncuları Değerlendir →
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Yaklaşan Maçlar */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Yaklaşan Maçlar ({upcomingMatches.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Takımlarınızın gelecek maçları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {upcomingMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚽</span>
                      </div>
                      <p className="text-lg font-medium mb-4 text-foreground">Yaklaşan maçınız yok.</p>
                    </div>
                  ) : (
                    upcomingMatches.map((match) => (
                      <div key={match.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {match.team_name} - {match.opponent_team || 'Rakip Takım'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(match.match_date).toLocaleDateString('tr-TR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })} - {(() => {
                                const date = new Date(match.match_date);
                                const hours = date.getHours().toString().padStart(2, '0');
                                const minutes = date.getMinutes().toString().padStart(2, '0');
                                return `${hours}:${minutes}`;
                              })()}
                            </p>
                            {match.location && (
                              <p className="text-sm text-muted-foreground">
                                📍 {match.location}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Planlandı
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={() => router.push(`/teams/${match.team_id}/matches/${match.id}`)}
                            size="sm"
                            variant="outline"
                          >
                            Detayları Gör
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Davetler - Sadece davet varsa göster */}
            {invitations.length > 0 && (
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Davetler ({invitations.length})
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Bekleyen takım davetleri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{invitation.team_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Davet eden: {invitation.invited_by_name}
                            </p>
                            {invitation.message && (
                              <p className="text-sm text-muted-foreground mt-1">{invitation.message}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {new Date(invitation.created_at).toLocaleDateString('tr-TR')}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Kabul Et
                          </Button>
                          <Button
                            onClick={() => handleInvitationResponse(invitation.id, 'reject')}
                            size="sm"
                            variant="destructive"
                          >
                            Reddet
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInviteModal && selectedTeam && (
        <InvitePlayerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
        />
      )}
      {showLeaveConfirm && (
        <ConfirmModal
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={confirmLeaveTeam}
          title="Takımdan Ayrıl"
          message="Bu takımdan ayrılmak istediğinizden emin misiniz? Bu işlem geri alınamaz."
        />
      )}
      {showTeamSelection && (
        <TeamSelectionModal
          isOpen={showTeamSelection}
          onClose={() => setShowTeamSelection(false)}
          onTeamSelect={handleTeamSelect}
          title="Takım Seçin"
          message="Hangi takım için işlem yapmak istiyorsunuz?"
        />
      )}
    </div>
  );
} 