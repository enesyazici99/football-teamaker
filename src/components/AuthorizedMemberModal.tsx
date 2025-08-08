'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

interface AuthorizedMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  currentAuthorizedMembers?: number[];
}

export default function AuthorizedMemberModal({ 
  isOpen, 
  onClose, 
  teamId, 
  teamName, 
  currentAuthorizedMembers = [] 
}: AuthorizedMemberModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [team, setTeam] = useState<{ id: number; name: string; created_by: number; authorized_members?: number[] } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTeamData = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team);
      }
    } catch (error) {
      console.error('Takım bilgileri yüklenemedi:', error);
    }
  }, [teamId]);

  const fetchPlayers = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/players`);
      if (response.ok) {
        const data = await response.json();
        // Takım sahibini listeden çıkar
        const filteredPlayers = data.players.filter((player: Player) => {
          // Takım sahibi kontrolü için team bilgisini de alalım
          return player.user_id !== team?.created_by;
        });
        setPlayers(filteredPlayers);
      }
    } catch (error) {
      console.error('Oyuncular yüklenemedi:', error);
    }
  }, [teamId, team?.created_by]);

  useEffect(() => {
    if (isOpen) {
      fetchTeamData();
      fetchPlayers();
    }
  }, [isOpen, fetchTeamData, fetchPlayers]);

  const handleAddAuthorized = async () => {
    if (!selectedPlayer) {
      setError('Lütfen bir oyuncu seçin');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/teams/authorized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          user_id: selectedPlayer,
          action: 'add'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Yetkili üye başarıyla eklendi',
          duration: 3000
        });
        setSelectedPlayer(null);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorMessage = data.error || 'Yetkili üye eklenemedi';
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'error',
          title: 'Hata!',
          message: errorMessage,
          duration: 4000
        });
        setError(errorMessage);
      }
    } catch {
      const errorMessage = 'Yetkili üye eklenemedi';
      (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
        type: 'error',
        title: 'Hata!',
        message: errorMessage,
        duration: 4000
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAuthorized = async (userId: number) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/teams/authorized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          user_id: userId,
          action: 'remove'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Yetkili üye başarıyla çıkarıldı',
          duration: 3000
        });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorMessage = data.error || 'Yetkili üye çıkarılamadı';
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'error',
          title: 'Hata!',
          message: errorMessage,
          duration: 4000
        });
        setError(errorMessage);
      }
    } catch {
      const errorMessage = 'Yetkili üye çıkarılamadı';
      (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
        type: 'error',
        title: 'Hata!',
        message: errorMessage,
        duration: 4000
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const authorizedPlayers = players.filter(player => currentAuthorizedMembers.includes(player.user_id));
  const nonAuthorizedPlayers = players.filter(player => !currentAuthorizedMembers.includes(player.user_id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="card-dark max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground flex justify-between items-center">
            <span>Yetkili Üye Yönetimi - {teamName}</span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Badge variant="destructive" className="w-full justify-center">
                {error}
              </Badge>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <Badge className="w-full justify-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {success}
              </Badge>
            </div>
          )}

          {/* Mevcut Yetkili Üyeler */}
          <div className="mb-6">
            <h3 className="font-medium text-foreground mb-3">Mevcut Yetkili Üyeler</h3>
            {authorizedPlayers.length === 0 ? (
              <Badge variant="outline" className="text-muted-foreground">
                Henüz yetkili üye yok
              </Badge>
            ) : (
              <div className="space-y-2">
                {authorizedPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-foreground">{player.full_name}</h4>
                      <Badge variant="outline" className="text-xs">@{player.username}</Badge>
                      {player.position && (
                        <Badge variant="secondary" className="text-xs ml-2">{player.position}</Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemoveAuthorized(player.user_id)}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      Yetkiyi Kaldır
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yeni Yetkili Üye Ekleme */}
          <div className="border-t border-border pt-6">
            <h3 className="font-medium text-foreground mb-3">Yeni Yetkili Üye Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Yetkili Yapılacak Oyuncu
                </label>
                <select
                  value={selectedPlayer || ''}
                  onChange={(e) => setSelectedPlayer(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  required
                >
                  <option value="">Oyuncu seçin</option>
                  {nonAuthorizedPlayers.map((player) => (
                    <option key={player.id} value={player.user_id}>
                      {player.full_name} (@{player.username})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayer && (
                <Card className="card-dark">
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-foreground mb-2">Seçili Oyuncu Bilgileri</h3>
                    {(() => {
                      const player = players.find(p => p.user_id === selectedPlayer);
                      if (!player) return null;
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Badge variant="outline" className="text-sm">Ad:</Badge>
                            <Badge variant="secondary" className="text-sm">{player.full_name}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <Badge variant="outline" className="text-sm">Kullanıcı Adı:</Badge>
                            <Badge variant="secondary" className="text-sm">@{player.username}</Badge>
                          </div>
                          {player.position && (
                            <div className="flex justify-between">
                              <Badge variant="outline" className="text-sm">Pozisyon:</Badge>
                              <Badge variant="secondary" className="text-sm">{player.position}</Badge>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <Badge variant="outline" className="text-sm">Puan:</Badge>
                            <Badge variant="secondary" className="text-sm">{player.skill_level}/10</Badge>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleAddAuthorized}
                  disabled={isLoading || !selectedPlayer}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Ekleniyor...' : 'Yetkili Yap'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 