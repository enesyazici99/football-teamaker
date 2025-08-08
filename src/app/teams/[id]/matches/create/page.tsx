'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  created_at: string;
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

export default function CreateMatchPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    match_date: '',
    match_time: '',
    location: '',
    opponent_team: ''
  });
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const [teamResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (teamResponse.ok) {
        const data = await teamResponse.json();
        setTeam(data.team);
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
  };

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Tarih ve saati birleştir - timezone sorununu çözmek için
      const [hours, minutes] = formData.match_time.split(':');
      const matchDate = new Date(formData.match_date);
      matchDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          team_id: parseInt(teamId),
          match_date: matchDate.toISOString(),
          location: formData.location,
          opponent_team: formData.opponent_team,
          status: 'scheduled'
        }),
      });

      if (response.ok) {
        (window as any).showToast({
          type: 'success',
          title: 'Başarılı',
          message: 'Maç başarıyla oluşturuldu',
          duration: 3000
        });
        router.push(`/teams/${teamId}/matches`);
      } else {
        const data = await response.json();
        setError(data.error || 'Maç oluşturulamadı');
      }
    } catch (error) {
      setError('Maç oluşturulamadı');
    } finally {
      setIsSubmitting(false);
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
          <Button
            onClick={() => router.push('/dashboard')}
            className="mt-4"
          >
            Dashboard'a Dön
          </Button>
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
          <Button
            onClick={() => router.push(`/teams/${teamId}/matches`)}
            className="mt-4"
          >
            Maçlara Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team.name} isAuthorized={isAuthorized} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Yeni Maç Oluştur</h1>
                <p className="text-lg text-muted-foreground mt-2">{team.name} takımı için yeni maç</p>
              </div>
              <Button
                onClick={() => router.push(`/teams/${teamId}/matches`)}
                variant="outline"
              >
                Maçlara Dön
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Badge variant="destructive" className="w-full justify-center">
                {error}
              </Badge>
            </div>
          )}

          {/* Form */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Maç Bilgileri
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Yeni maç için gerekli bilgileri doldurun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="match_date" className="block text-sm font-medium text-foreground mb-2">
                    Maç Tarihi
                  </label>
                  <Input
                    id="match_date"
                    type="date"
                    value={formData.match_date}
                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="match_time" className="block text-sm font-medium text-foreground mb-2">
                    Maç Saati
                  </label>
                  <Input
                    id="match_time"
                    type="time"
                    value={formData.match_time}
                    onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                    Lokasyon
                  </label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Maç lokasyonu (örn: Merkez Halı Saha)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="opponent_team" className="block text-sm font-medium text-foreground mb-2">
                    Rakipler
                  </label>
                  <Input
                    id="opponent_team"
                    type="text"
                    placeholder="Rakiplerin takım adı (örn: Fenerbahçe)"
                    value={formData.opponent_team}
                    onChange={(e) => setFormData({ ...formData, opponent_team: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    onClick={() => router.push(`/teams/${teamId}/matches`)}
                    variant="outline"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Oluşturuluyor...' : 'Maç Oluştur'}
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