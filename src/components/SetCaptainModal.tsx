'use client';

import { useState, useEffect } from 'react';
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

interface SetCaptainModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  currentCaptainId?: number;
}

export default function SetCaptainModal({ isOpen, onClose, teamId, teamName, currentCaptainId }: SetCaptainModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/players`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Oyuncular yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) {
      setError('Lütfen bir oyuncu seçin');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/teams/captain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          captain_id: selectedPlayer,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        (window as any).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Takım kaptanı başarıyla belirlendi',
          duration: 3000
        });
        setSelectedPlayer(null);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorMessage = data.error || 'Kaptan belirlenemedi';
        (window as any).showToast({
          type: 'error',
          title: 'Hata!',
          message: errorMessage,
          duration: 4000
        });
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Kaptan belirlenemedi';
      (window as any).showToast({
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="card-dark max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground flex justify-between items-center">
            <span>Kaptan Belirle - {teamName}</span>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Oyuncu Seçimi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kaptan Olacak Oyuncu
              </label>
              <select
                value={selectedPlayer || ''}
                onChange={(e) => setSelectedPlayer(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                required
              >
                <option value="">Oyuncu seçin</option>
                {players.map((player) => (
                  <option key={player.id} value={player.user_id}>
                    {player.full_name} (@{player.username})
                    {currentCaptainId === player.user_id ? ' - Mevcut Kaptan' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Seçili Oyuncu Bilgileri */}
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

            {/* Butonlar */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedPlayer}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Belirleniyor...' : 'Kaptan Belirle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 