'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import Navbar from '@/components/navbar';
import PlayerRatingModal from '@/components/PlayerRatingModal';

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

interface Player {
  id: number;
  user_id: number;
  full_name: string;
  username: string;
  skill_level: number;
  position?: string;
}

interface PlayerRating {
  id?: number;
  rated_player_id: number;
  rater_player_id: number;
  match_id: number;
  rating: number;
  notes?: string;
  rated_player_name?: string;
  rated_player_username?: string;
  rater_player_name?: string;
  rater_player_username?: string;
  created_at?: string;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  created_at: string;
  authorized_members?: number[];
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

export default function MatchDetailPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPlayerForRating, setSelectedPlayerForRating] = useState<Player | null>(null);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const matchId = params.matchId as string;

  const fetchMatchData = useCallback(async () => {
    try {
      const [matchResponse, teamResponse, playersResponse, ratingsResponse, userResponse] = await Promise.all([
        fetch(`/api/matches/${matchId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/players`, { credentials: 'include' }),
        fetch(`/api/matches/${matchId}/ratings`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        setMatch(matchData.match);
      }

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
      }

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(playersData.players);
        // Mevcut kullanıcının player bilgisini bul
        const currentPlayerData = playersData.players.find((p: Player) => p.user_id === currentUser?.id);
        setCurrentPlayer(currentPlayerData || null);
      }

      if (ratingsResponse.ok) {
        const ratingsData = await ratingsResponse.json();
        setRatings(ratingsData.ratings || []);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Maç bilgileri yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, matchId, currentUser?.id]);

  useEffect(() => {
    if (teamId && matchId) {
      fetchMatchData();
    }
  }, [teamId, matchId, fetchMatchData]);

  const isMatchCompleted = () => {
    if (!match) return false;
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000));
    return now > matchEndTime;
  };





  const isScoreEditable = () => {
    return isAuthorized && isMatchCompleted();
  };

  const isMatchDeletable = () => {
    return isTeamOwner || (team?.authorized_members || []).includes(currentUser?.id || 0);
  };

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'scheduled':
        return isMatchCompleted() ? 'Tamamlandı' : 'Planlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    const actualStatus = status === 'scheduled' && isMatchCompleted() ? 'completed' : status;
    
    switch (actualStatus) {
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Belirli bir oyuncunun ortalama puanını hesapla
  const getPlayerAverageRating = (playerId: number) => {
    const playerRatings = ratings.filter(r => r.rated_player_id === playerId);
    if (playerRatings.length === 0) return 0;
    
    const totalRating = playerRatings.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((totalRating / playerRatings.length) * 10) / 10;
  };

  // Belirli bir oyuncunun puanlanıp puanlanmadığını kontrol et
  const isPlayerRated = (raterPlayerId: number, ratedPlayerId: number) => {
    return ratings.some(r => r.rater_player_id === raterPlayerId && r.rated_player_id === ratedPlayerId);
  };

  // Puanlama modalını aç
  const handleRatePlayer = (player: Player) => {
    setSelectedPlayerForRating(player);
    setShowRatingModal(true);
  };

  // Puanlama kaydet
  const handleSaveRating = async (rating: number, notes: string) => {
    if (!selectedPlayerForRating || !currentPlayer) return;

    try {
      const response = await fetch(`/api/matches/${matchId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          rated_player_id: selectedPlayerForRating.id,
          rater_player_id: currentPlayer.id,
          rating,
          notes
        })
      });

      if (response.ok) {
        // Puanlamaları yeniden yükle
        const ratingsResponse = await fetch(`/api/matches/${matchId}/ratings`, { credentials: 'include' });
        if (ratingsResponse.ok) {
          const ratingsData = await ratingsResponse.json();
          setRatings(ratingsData.ratings || []);
        }

        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Oyuncu puanı başarıyla kaydedildi',
          duration: 3000
        });
      } else {
        throw new Error('Puanlama kaydedilemedi');
      }
    } catch {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata!',
        message: 'Puanlama kaydedilemedi',
        duration: 4000
      });
    }
  };

  // Skor güncelle
  const handleScoreUpdate = async (homeScore: number, awayScore: number) => {
    if (!match || !isAuthorized) return;

    setIsUpdatingScore(true);
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          home_score: homeScore,
          away_score: awayScore,
          status: match.status // Mevcut durumu koru, sadece skoru güncelle
        })
      });

      if (response.ok) {
        const updatedMatch = await response.json();
        setMatch(updatedMatch.match);
        
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Maç skoru güncellendi',
          duration: 3000
        });
      } else {
        throw new Error('Skor güncellenemedi');
      }
    } catch {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata!',
        message: 'Skor güncellenemedi',
        duration: 4000
      });
    } finally {
      setIsUpdatingScore(false);
    }
  };

  const handleDeleteMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Maç başarıyla silindi',
          duration: 3000
        });
        router.push(`/teams/${teamId}/matches`);
      } else {
        throw new Error('Maç silinemedi');
      }
    } catch {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata!',
        message: 'Maç silinemedi',
        duration: 4000
      });
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

  if (!match || !team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Maç bulunamadı</p>
          <button
            onClick={() => router.push(`/teams/${teamId}/matches`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Maçlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team?.name} isAuthorized={isAuthorized} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {team?.name} - {match.opponent_team || 'Rakip Takım'}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  {formatMatchDate(match.match_date)} - {formatMatchTime(match.match_date)}
                </p>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={() => router.push(`/teams/${teamId}/matches`)}
                  variant="outline"
                >
                  Maçlara Dön
                </Button>
                {isScoreEditable() && (
                  <Button
                    onClick={() => {
                      // Skor güncelleme modalını aç
                      const homeScore = prompt('Ev sahibi skoru:', match.home_score.toString());
                      const awayScore = prompt('Deplasman skoru:', match.away_score.toString());
                      if (homeScore && awayScore) {
                        handleScoreUpdate(parseInt(homeScore), parseInt(awayScore));
                      }
                    }}
                    disabled={isUpdatingScore}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUpdatingScore ? 'Güncelleniyor...' : 'Skor Güncelle'}
                  </Button>
                )}
                {isMatchDeletable() && (
                  <Button
                    onClick={() => {
                      if (confirm('Bu maçı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                        handleDeleteMatch();
                      }
                    }}
                    variant="destructive"
                  >
                    Maçı Sil
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Maç Bilgileri */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Maç Bilgileri
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Maç detayları ve durumu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-sm">
                      Tarih:
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                      {formatMatchDate(match.match_date)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-sm">
                      Saat:
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                      {formatMatchTime(match.match_date)}
                    </Badge>
                  </div>
                  
                  {match.location && (
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-sm">
                        Lokasyon:
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {match.location}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-sm">
                      Durum:
                    </Badge>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusText(match.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-sm">
                      Skor:
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                      {match.home_score} - {match.away_score}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Oyuncu Puanlamaları */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Oyuncu Puanlamaları
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isMatchCompleted() 
                    ? 'Maç sonrası oyuncu puanları'
                    : 'Maç bitmeden puanlama yapılamaz'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {players.map((player) => {
                    const averageRating = getPlayerAverageRating(player.id);
                    const isRatedByCurrentPlayer = currentPlayer && isPlayerRated(currentPlayer.id, player.id);
                    
                    return (
                      <div key={player.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{player.full_name}</h3>
                            <Badge variant="outline" className="text-xs">
                              @{player.username}
                            </Badge>
                            {player.position && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                {player.position}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= averageRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {averageRating.toFixed(1)}/10
                            </Badge>
                          </div>
                        </div>
                        
                        {isMatchCompleted() && currentPlayer && player.id !== currentPlayer.id && (
                          <div className="flex justify-between items-center">
                            {isRatedByCurrentPlayer ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Puanladınız
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => handleRatePlayer(player)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Puanla
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {!isMatchCompleted() && (
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="text-muted-foreground">
                              Maç bitmeden puanlama yapılamaz
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Puanlama Modal */}
      {showRatingModal && selectedPlayerForRating && (
        <PlayerRatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSave={handleSaveRating}
          player={selectedPlayerForRating}
        />
      )}
    </div>
  );
} 