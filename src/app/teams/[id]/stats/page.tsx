'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import TeamNavigation from '@/components/TeamNavigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Player {
  id: number;
  user_id: number;
  full_name: string;
  username: string;
  skill_level: number;
  position?: string;
}

interface PlayerRating {
  id: number;
  rated_player_id: number;
  rater_player_id: number;
  match_id: number;
  rating: number;
  notes?: string;
  rated_player_name?: string;
  rated_player_username?: string;
  rater_player_name?: string;
  rater_player_username?: string;
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

interface User {
  id: number;
  full_name: string;
  username: string;
}

export default function TeamStatsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const fetchData = useCallback(async () => {
    try {
      const [teamResponse, playersResponse, matchesResponse, ratingsResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/players`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/matches`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/ratings`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
      }

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(playersData.players || []);
      }

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const allMatches = matchesData.matches || [];
        
        // Maç durumlarını güncelle - eğer maç tarihi geçmişte ve status hala scheduled ise completed yap
        const now = new Date();
        const updatedMatches = allMatches.map((match: Match) => {
          const matchDate = new Date(match.match_date);
          const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000)); // 2 saat sonra
          
          if (matchEndTime < now && match.status === 'scheduled') {
            // Maç bitmeli ama hala scheduled durumunda
            return { ...match, status: 'completed' };
          }
          return match;
        });
        
        setMatches(updatedMatches);
      }

      if (ratingsResponse.ok) {
        const ratingsData = await ratingsResponse.json();
        console.log('Fetched ratings:', ratingsData.ratings);
        setRatings(ratingsData.ratings || []);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      setError('Veriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [teamId, fetchData]);

  const getPlayerAverageRating = (playerId: number, period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const periodRatings = ratings.filter(rating => 
      rating.rated_player_id === playerId && 
      new Date(rating.created_at) >= startDate
    );

    if (periodRatings.length === 0) return 0;
    
    const totalRating = periodRatings.reduce((sum, rating) => sum + rating.rating, 0);
    return totalRating / periodRatings.length;
  };

  const getPlayerRatingCount = (playerId: number, period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    return ratings.filter(rating => 
      rating.rated_player_id === playerId && 
      new Date(rating.created_at) >= startDate
    ).length;
  };

  const getPeriodText = (period: 'week' | 'month' | 'year') => {
    switch (period) {
      case 'week':
        return 'Haftalık';
      case 'month':
        return 'Aylık';
      case 'year':
        return 'Yıllık';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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

  // Yetki kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isCaptain = team?.captain_id === currentUser?.id;
  const isInAuthorizedMembers = team?.authorized_members?.includes(currentUser?.id || 0) || false;
  const isAuthorized = isTeamOwner || isCaptain || isInAuthorizedMembers;

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team.name} isAuthorized={isAuthorized} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{team.name} - İstatistikler</h1>
                {team.description && (
                  <p className="text-lg text-muted-foreground mt-2">{team.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setSelectedPeriod('week')}
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                >
                  Haftalık
                </Button>
                <Button
                  onClick={() => setSelectedPeriod('month')}
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                >
                  Aylık
                </Button>
                <Button
                  onClick={() => setSelectedPeriod('year')}
                  variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                >
                  Yıllık
                </Button>
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

          {/* Chart 1: Oyuncu Performans Grafiği */}
          <Card className="card-dark mb-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Oyuncu Performans Grafiği
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {getPeriodText(selectedPeriod)} ortalama puanlar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {players.length > 0 && ratings.length > 0 ? (
                <Bar
                  data={{
                    labels: players.map(p => p.full_name),
                    datasets: [
                      {
                        label: 'Ortalama Puan',
                        data: players.map(p => getPlayerAverageRating(p.id, selectedPeriod)),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: 'Değerlendirme Sayısı',
                        data: players.map(p => getPlayerRatingCount(p.id, selectedPeriod)),
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 10
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Henüz puan verisi bulunmuyor</p>
                  <p className="text-sm text-muted-foreground mt-2">Maçlar tamamlandıktan sonra oyuncular birbirlerini puanlayabilir</p>
                </div>
              )}
              
              {/* Detaylı Liste */}
              <div className="mt-6 space-y-3">
                {players.map((player) => {
                  const avgRating = getPlayerAverageRating(player.id, selectedPeriod);
                  const ratingCount = getPlayerRatingCount(player.id, selectedPeriod);
                  
                  if (ratingCount === 0) return null;
                  
                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {player.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{player.full_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            @{player.username}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
                          <Badge variant="secondary" className="text-xs">
                            Ortalama
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">{ratingCount}</div>
                          <Badge variant="outline" className="text-xs">
                            Puan
                          </Badge>
                        </div>
                        <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(avgRating / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Maç İstatistikleri */}
          <Card className="card-dark mb-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Maç İstatistikleri
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Tüm zamanların maç durumu özeti
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Doughnut
                    data={{
                      labels: ['Tamamlanan', 'Planlanan', 'İptal'],
                      datasets: [{
                        data: [
                          matches.filter(m => m.status === 'completed').length,
                          matches.filter(m => m.status === 'scheduled').length,
                          matches.filter(m => m.status === 'cancelled').length
                        ],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.5)',
                          'rgba(59, 130, 246, 0.5)',
                          'rgba(239, 68, 68, 0.5)'
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)',
                          'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-foreground">{matches.length}</div>
                    <Badge variant="secondary">Toplam Maç</Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {matches.filter(m => m.status === 'completed').length}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Tamamlanan</Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {matches.filter(m => m.status === 'scheduled').length}
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Planlanan</Badge>
                  </div>
                </div>
              </div>
              
              {/* Son Maçlar */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Son Tamamlanan Maçlar</h3>
                <div className="space-y-2">
                  {matches
                    .filter(m => m.status === 'completed')
                    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
                    .slice(0, 3)
                    .map(match => (
                      <div key={match.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div>
                          <p className="text-sm font-medium">{match.opponent_team || 'Rakip Belirtilmemiş'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(match.match_date).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {match.home_score} - {match.away_score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart 3: En İyi Oyuncular */}
          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    En İyi Oyuncular
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {getPeriodText(selectedPeriod)} en yüksek puanlı oyuncular
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players
                  .map(player => ({
                    ...player,
                    avgRating: getPlayerAverageRating(player.id, selectedPeriod),
                    ratingCount: getPlayerRatingCount(player.id, selectedPeriod)
                  }))
                  .filter(player => player.ratingCount > 0)
                  .sort((a, b) => b.avgRating - a.avgRating)
                  .slice(0, 5)
                  .map((player, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {index < 3 ? medals[index] : (
                              <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{player.full_name}</h3>
                            <Badge variant="outline" className="text-xs">
                              @{player.username}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">{player.avgRating.toFixed(1)}</div>
                            <Badge variant="secondary" className="text-xs">
                              Puan
                            </Badge>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-foreground">{player.ratingCount}</div>
                            <Badge variant="outline" className="text-xs">
                              Oy
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {players.filter(p => getPlayerRatingCount(p.id, selectedPeriod) > 0).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Henüz puanlanan oyuncu yok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 