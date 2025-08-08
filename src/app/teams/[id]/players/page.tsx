'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SetCaptainModal from '@/components/SetCaptainModal';
import AuthorizedMemberModal from '@/components/AuthorizedMemberModal';
import Navbar from '@/components/navbar';
import TeamNavigation from '@/components/TeamNavigation';

interface Player {
  id: number;
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
  authorized_members?: number[];
  created_at: string;
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

export default function TeamPlayersPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSetCaptainModal, setShowSetCaptainModal] = useState(false);
  const [showAuthorizedMemberModal, setShowAuthorizedMemberModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const fetchTeamData = useCallback(async () => {
    try {
      const [teamResponse, playersResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/players`, { credentials: 'include' }),
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

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
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

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id || (team?.authorized_members || []).includes(currentUser?.id || 0);
  const isTeamMember = players.some(player => player.user_id === currentUser?.id && player.is_active);

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
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'unavailable':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'maybe':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
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

  // Pozisyon kategorileri için yardımcı fonksiyonlar
  const getPositionCategory = (position: string) => {
    const lowerPosition = position.toLowerCase();
    
    // Kaleci
    if (lowerPosition.includes('kaleci') || lowerPosition.includes('gk') || lowerPosition.includes('goalkeeper') || 
        lowerPosition.includes('keeper') || lowerPosition.includes('goalie')) {
      return 'kaleci';
    }
    
    // Defans
    if (lowerPosition.includes('stoper') || lowerPosition.includes('bek') || lowerPosition.includes('defans') || 
        lowerPosition.includes('defender') || lowerPosition.includes('center back') || lowerPosition.includes('full back') ||
        lowerPosition.includes('cb') || lowerPosition.includes('lb') || lowerPosition.includes('rb') ||
        lowerPosition.includes('sweeper') || lowerPosition.includes('wing back') || lowerPosition.includes('wb') ||
        lowerPosition.includes('libero') || lowerPosition.includes('stopper')) {
      return 'defans';
    }
    
    // Orta saha
    if (lowerPosition.includes('orta') || lowerPosition.includes('saha') || lowerPosition.includes('kanat') ||
        lowerPosition.includes('midfielder') || lowerPosition.includes('winger') || lowerPosition.includes('wing') ||
        lowerPosition.includes('cm') || lowerPosition.includes('dm') || lowerPosition.includes('am') ||
        lowerPosition.includes('lm') || lowerPosition.includes('rm') || lowerPosition.includes('lw') || lowerPosition.includes('rw') ||
        lowerPosition.includes('playmaker') || lowerPosition.includes('box to box') || lowerPosition.includes('holding') ||
        lowerPosition.includes('attacking') || lowerPosition.includes('defensive') || lowerPosition.includes('central') ||
        lowerPosition.includes('left') || lowerPosition.includes('right') || lowerPosition.includes('wide')) {
      return 'orta saha';
    }
    
    // Forvet
    if (lowerPosition.includes('forvet') || lowerPosition.includes('striker') || lowerPosition.includes('forward') ||
        lowerPosition.includes('cf') || lowerPosition.includes('st') || lowerPosition.includes('f') ||
        lowerPosition.includes('center forward') || lowerPosition.includes('second striker') || lowerPosition.includes('ss') ||
        lowerPosition.includes('target man') || lowerPosition.includes('poacher') || lowerPosition.includes('false nine') ||
        lowerPosition.includes('complete forward') || lowerPosition.includes('advanced forward') || lowerPosition.includes('deep lying forward')) {
      return 'forvet';
    }
    
    return 'diğer';
  };

  const getPositionBadgeColor = (category: string) => {
    switch (category) {
      case 'kaleci':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700';
      case 'defans':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700';
      case 'orta saha':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700';
      case 'forvet':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700';
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
                <h1 className="text-3xl font-bold text-foreground">{team.name} - Oyuncular</h1>
                {team.description && (
                  <p className="text-lg text-muted-foreground mt-2">{team.description}</p>
                )}
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

          {/* Navigation */}
          <TeamNavigation teamId={teamId} isAuthorized={isAuthorized} />

          {/* Oyuncular */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const role = getPlayerRole(player);
              return (
                <Card key={player.id} className="card-dark hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {player.full_name}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          @{player.username}
                        </CardDescription>
                      </div>
                      <Badge className={getRoleColor(role)}>
                        {role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {player.position && (
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            Atanan Pozisyon:
                          </Badge>
                          <Badge className={getPositionBadgeColor(getPositionCategory(player.position))}>
                            {player.position}
                          </Badge>
                        </div>
                      )}
                      {player.positions && player.positions.length > 0 && (
                        <div>
                          <Badge variant="outline" className="text-xs mb-2">
                            Tercih Ettiği Mevkiler:
                          </Badge>
                          <div className="flex flex-wrap gap-1">
                            {player.positions.map((position, index) => (
                              <Badge 
                                key={index} 
                                className={getPositionBadgeColor(getPositionCategory(position))}
                              >
                                {position}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          Puan:
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {player.skill_level}/10
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          Durum:
                        </Badge>
                        <Badge className={getAvailabilityStatusColor(player.availability_status || 'available')}>
                          {getAvailabilityStatusText(player.availability_status || 'available')}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          Katılım:
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(player.created_at).toLocaleDateString('tr-TR')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {players.length === 0 && (
            <Card className="card-dark">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-lg font-medium mb-4 text-foreground">Henüz oyuncu bulunmuyor.</p>
                {isAuthorized && (
                  <Button
                    onClick={() => router.push(`/teams/${teamId}`)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    Oyuncu Davet Et
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Kaptan Belirleme Modal */}
          {showSetCaptainModal && team && (
            <SetCaptainModal
              isOpen={showSetCaptainModal}
              onClose={() => setShowSetCaptainModal(false)}
              teamId={team.id}
              teamName={team.name}
              currentCaptainId={team.captain_id}
            />
          )}
        </div>
      </div>
      
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