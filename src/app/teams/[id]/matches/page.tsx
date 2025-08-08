'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import ConfirmModal from '@/components/ConfirmModal';

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
}

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  authorized_members?: number[];
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
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

export default function TeamMatchesPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  useEffect(() => {
    if (teamId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          console.log('Loading data for team:', teamId);
          await Promise.all([fetchTeamData(), fetchMatches(), fetchPlayers()]);
          console.log('Data loaded successfully');
        } catch (error) {
          console.error('Veri yüklenirken hata oluştu:', error);
          setError('Veriler yüklenirken bir hata oluştu');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      console.log('Fetching team data for team:', teamId);
      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Team data received:', data);
        setTeam(data.team);
        setCurrentUser(data.currentUser);
      } else {
        throw new Error('Takım bilgileri yüklenemedi');
      }
    } catch (error) {
      console.error('Takım bilgileri yüklenemedi:', error);
      throw error;
    }
  };

  const fetchMatches = async () => {
    try {
      console.log('Fetching matches for team:', teamId);
      const response = await fetch(`/api/teams/${teamId}/matches`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Matches data received:', data);
        setMatches(data.matches || []);
      } else {
        throw new Error('Maçlar yüklenemedi');
      }
    } catch (error) {
      console.error('Maçlar yüklenemedi:', error);
      throw error;
    }
  };

  const fetchPlayers = async () => {
    try {
      console.log('Fetching players for team:', teamId);
      const response = await fetch(`/api/teams/${teamId}/players`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Players data received:', data);
        setPlayers(data.players || []);
      } else {
        throw new Error('Oyuncular yüklenemedi');
      }
    } catch (error) {
      console.error('Oyuncular yüklenemedi:', error);
      throw error;
    }
  };

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id || (team?.authorized_members || []).includes(currentUser?.id || 0);
  const isTeamMember = players.some(player => player.user_id === currentUser?.id && player.is_active);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'scheduled':
        return 'Planlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    // Timezone offset'ini düzelt
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleMatchClick = (matchId: number) => {
    router.push(`/teams/${teamId}/matches/${matchId}`);
  };

  const handleEditMatch = (match: Match) => {
    // Maç düzenleme sayfasına git
    router.push(`/teams/${teamId}/matches/${match.id}/edit`);
  };

  const handleDeleteMatch = (match: Match) => {
    setMatchToDelete(match);
    setShowDeleteModal(true);
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;

    try {
      const response = await fetch(`/api/matches/${matchToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        (window as any).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Maç başarıyla silindi',
          duration: 3000
        });
        // Maçları yeniden yükle
        fetchMatches();
      } else {
        throw new Error('Maç silinemedi');
      }
    } catch (error) {
      (window as any).showToast({
        type: 'error',
        title: 'Hata!',
        message: 'Maç silinemedi',
        duration: 4000
      });
    } finally {
      setShowDeleteModal(false);
      setMatchToDelete(null);
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
            Dashboard'a Dön
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
            Dashboard'a Dön
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
                <h1 className="text-3xl font-bold text-foreground">{team.name} - Maçlar</h1>
                {team.description && (
                  <p className="text-lg text-muted-foreground mt-2">{team.description}</p>
                )}
              </div>
              {isAuthorized && (
                <Button
                  onClick={() => router.push(`/teams/${teamId}/matches/create`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Yeni Maç
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

          {/* Maçlar */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className="card-dark hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleMatchClick(match.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {team?.name} - {match.opponent_team || 'Rakip Takım'}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {new Date(match.match_date).toLocaleDateString('tr-TR')} - {formatMatchTime(match.match_date)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusText(match.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {match.location && (
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          Lokasyon:
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {match.location}
                        </Badge>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        Skor:
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {match.home_score} - {match.away_score}
                      </Badge>
                    </div>
                    
                    {isAuthorized && (
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMatch(match);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          Düzenle
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMatch(match);
                          }}
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                        >
                          Sil
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {matches.length === 0 && (
            <Card className="card-dark">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚽</span>
                </div>
                <p className="text-lg font-medium mb-4 text-foreground">Henüz maç bulunmuyor.</p>
                {isAuthorized && (
                  <Button
                    onClick={() => router.push(`/teams/${teamId}/matches/create`)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    İlk Maçınızı Oluşturun
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteMatch}
        title="Maç Silme"
        message={`"${matchToDelete?.opponent_team || 'Bu maç'}" adlı maçı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
} 