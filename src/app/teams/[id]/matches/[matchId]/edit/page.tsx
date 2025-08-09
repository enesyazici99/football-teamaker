'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';

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

export default function EditMatchPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const matchId = params.matchId as string;

  const [formData, setFormData] = useState({
    match_date: '',
    match_time: '',
    location: '',
    opponent_team: '',
    status: 'scheduled',
    home_score: 0,
    away_score: 0
  });

  const fetchData = useCallback(async () => {
    try {
      const [matchResponse, teamResponse, userResponse] = await Promise.all([
        fetch(`/api/matches/${matchId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        setMatch(matchData.match);
        
        // Form verilerini doldur
        const matchDate = new Date(matchData.match.match_date);
        const hours = matchDate.getHours().toString().padStart(2, '0');
        const minutes = matchDate.getMinutes().toString().padStart(2, '0');
        
        setFormData({
          match_date: matchDate.toISOString().split('T')[0],
          match_time: `${hours}:${minutes}`,
          location: matchData.match.location || '',
          opponent_team: matchData.match.opponent_team || '',
          status: matchData.match.status,
          home_score: matchData.match.home_score || 0,
          away_score: matchData.match.away_score || 0
        });
      }

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, matchId]);

  useEffect(() => {
    if (teamId && matchId) {
      fetchData();
    }
  }, [teamId, matchId, fetchData]);

  // Yetki kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id || (team?.authorized_members || []).includes(currentUser?.id || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Tarih ve saati birleştir - güvenli şekilde
      const matchDate = new Date(formData.match_date);
      
      if (formData.match_time && formData.match_time.includes(':')) {
        const [hours, minutes] = formData.match_time.split(':');
        matchDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      } else {
        // Eğer saat bilgisi yoksa varsayılan olarak 12:00'ye ayarla
        matchDate.setHours(12, 0, 0, 0);
      }
      
      // Güvenli skor dönüşümü
      const homeScore = Number(formData.home_score) || 0;
      const awayScore = Number(formData.away_score) || 0;
      
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          match_date: matchDate.toISOString(),
          location: formData.location || '',
          opponent_team: formData.opponent_team || '',
          status: formData.status,
          home_score: homeScore,
          away_score: awayScore
        }),
      });

      if (response.ok) {
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı',
          message: 'Maç başarıyla güncellendi',
          duration: 3000
        });
        router.push(`/teams/${teamId}/matches`);
      } else {
        const data = await response.json();
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'error',
          title: 'Hata',
          message: data.error || 'Maç güncellenemedi',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Maç güncelleme hatası:', error);
      setError(error instanceof Error ? error.message : 'Maç güncellenemedi');
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata',
        message: error instanceof Error ? error.message : 'Maç güncellenemedi',
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'home_score' || name === 'away_score' ? (value === '' ? 0 : parseInt(value) || 0) : value
    }));
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

  if (!match || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Badge variant="destructive" className="mb-4">
            Maç bulunamadı
          </Badge>
          <button
            onClick={() => router.push(`/teams/${teamId}/matches`)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Maçlara Dön
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Badge variant="destructive" className="mb-4">
            Bu işlem için yetkiniz yok
          </Badge>
          <button
            onClick={() => router.push(`/teams/${teamId}/matches`)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Maçlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team.name} isAuthorized={isAuthorized} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Maç Düzenle</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {team.name} - Maç #{match.id}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Badge variant="destructive" className="w-full justify-center">
                {error}
              </Badge>
            </div>
          )}

          <Card className="card-dark">
            <CardHeader>
              <CardTitle>Maç Bilgileri</CardTitle>
              <CardDescription>
                Maç detaylarını güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maç Tarihi
                    </label>
                    <Input
                      type="date"
                      name="match_date"
                      value={formData.match_date}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maç Saati
                    </label>
                    <Input
                      type="time"
                      name="match_time"
                      value={formData.match_time}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Lokasyon
                  </label>
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Maç lokasyonu"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Deplasman Takımı
                  </label>
                  <Input
                    type="text"
                    name="opponent_team"
                    value={formData.opponent_team}
                    onChange={handleInputChange}
                    placeholder="Deplasman takımı"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Durum
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="scheduled">Planlandı</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ev Sahibi Skoru
                    </label>
                    <Input
                      type="number"
                      name="home_score"
                      value={formData.home_score || 0}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Deplasman Skoru
                    </label>
                    <Input
                      type="number"
                      name="away_score"
                      value={formData.away_score || 0}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/teams/${teamId}/matches`)}
                    disabled={isSubmitting}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 