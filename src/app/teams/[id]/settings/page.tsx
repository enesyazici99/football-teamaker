'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/navbar';
import ConfirmModal from '@/components/ConfirmModal';
import TeamNavigation from '@/components/TeamNavigation';

interface Team {
  id: number;
  name: string;
  team_size: number;
  created_by: number;
  captain_id?: number;
  authorized_members?: number[];
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

export default function TeamSettingsPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Team info editing states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  
  // Team size states
  const [isUpdatingSize, setIsUpdatingSize] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(11);
  
  // Team deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const fetchTeamData = useCallback(async () => {
    try {
      const [teamResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
        setTeamName(teamData.team.name);
        setSelectedSize(teamData.team.team_size);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch {
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

  // Yetki kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isAuthorized = isTeamOwner || team?.captain_id === currentUser?.id || (team?.authorized_members || []).includes(currentUser?.id || 0);

  const handleUpdateTeamInfo = async () => {
    if (!teamName.trim()) {
      setError('Takım adı boş olamaz');
      return;
    }

    setIsUpdatingInfo(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: teamName.trim() }),
      });

      if (response.ok) {
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Takım bilgileri güncellendi',
          duration: 3000
        });
        await fetchTeamData();
        setIsEditingInfo(false);
        setSuccess('Takım bilgileri başarıyla güncellendi');
      } else {
        const data = await response.json();
        setError(data.error || 'Takım bilgileri güncellenemedi');
      }
    } catch {
      setError('Takım bilgileri güncellenemedi');
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleUpdateTeamSize = async (newSize: number) => {
    setIsUpdatingSize(true);
    setError('');
    setSuccess('');

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
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Takım boyutu güncellendi',
          duration: 3000
        });
        await fetchTeamData();
        setSuccess('Takım boyutu başarıyla güncellendi');
      } else {
        setError('Takım boyutu güncellenemedi');
      }
    } catch {
      setError('Takım boyutu güncellenemedi');
    } finally {
      setIsUpdatingSize(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || deleteConfirmName !== team.name) {
      return;
    }

    setIsDeletingTeam(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Takım silindi',
          duration: 3000
        });
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Takım silinemedi');
      }
    } catch {
      setError('Takım silinemedi');
    } finally {
      setIsDeletingTeam(false);
      setShowDeleteModal(false);
      setDeleteConfirmName('');
    }
  };

  const teamSizeOptions = [
    { value: 5, label: '5v5 (Futsal)' },
    { value: 6, label: '6v6' },
    { value: 7, label: '7v7' },
    { value: 8, label: '8v8' },
    { value: 9, label: '9v9' },
    { value: 10, label: '10v10' },
    { value: 11, label: '11v11 (Futbol)' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar teamId={teamId} teamName={team?.name} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar teamId={teamId} teamName={team?.name} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge variant="destructive" className="mb-4">
                  Yetkisiz Erişim
                </Badge>
                <p className="text-muted-foreground mb-4">
                  Bu sayfaya erişim yetkiniz bulunmuyor.
                </p>
                <Button
                  onClick={() => router.push(`/teams/${teamId}`)}
                  className="mt-4"
                >
                  Takıma Geri Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team?.name} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-foreground">Takım Ayarları</h1>
              <Badge variant="outline">{team?.name}</Badge>
            </div>
            <p className="text-muted-foreground">
              Takım bilgilerini düzenleyin ve ayarları yönetin
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Card className="mb-6 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <Badge variant="destructive" className="w-full justify-center">
                  {error}
                </Badge>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="mb-6 border-green-500/50 bg-green-500/10">
              <CardContent className="pt-6">
                <Badge className="w-full justify-center bg-green-500 hover:bg-green-600">
                  {success}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <TeamNavigation teamId={teamId} isAuthorized={isAuthorized} />

          <div className="grid gap-6">
            {/* Team Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Takım Bilgileri</span>
                  {!isEditingInfo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingInfo(true)}
                    >
                      Düzenle
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  Takım adını ve temel bilgileri düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingInfo ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Takım Adı
                      </label>
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Takım adını girin..."
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateTeamInfo}
                        disabled={isUpdatingInfo || !teamName.trim()}
                        className="flex-1"
                      >
                        {isUpdatingInfo ? 'Güncelleniyor...' : 'Kaydet'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingInfo(false);
                          setTeamName(team?.name || '');
                          setError('');
                        }}
                        className="flex-1"
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Takım Adı
                      </label>
                      <p className="text-lg font-medium">{team?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Oluşturulma Tarihi
                      </label>
                      <p className="text-sm">
                        {team?.created_at ? new Date(team.created_at).toLocaleDateString('tr-TR') : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Size Card */}
            <Card>
              <CardHeader>
                <CardTitle>Takım Boyutu</CardTitle>
                <CardDescription>
                  Takımınızın kaç kişilik olacağını belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Mevcut Boyut: <span className="font-bold">{team?.team_size}v{team?.team_size}</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {teamSizeOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedSize === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSize(option.value)}
                          className="text-xs"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {selectedSize !== team?.team_size && (
                    <Button
                      onClick={() => handleUpdateTeamSize(selectedSize)}
                      disabled={isUpdatingSize}
                      className="w-full"
                    >
                      {isUpdatingSize ? 'Güncelleniyor...' : `${selectedSize}v${selectedSize} Olarak Güncelle`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone - Only for team owner */}
            {isTeamOwner && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
                  <CardDescription>
                    Bu işlemler geri alınamaz. Dikkatli olun.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                      <h4 className="font-medium text-destructive mb-2">Takımı Sil</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Bu takımı kalıcı olarak sileceksiniz. Tüm veriler (oyuncular, maçlar, istatistikler) silinecek.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full"
                      >
                        Takımı Sil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/teams/${teamId}`)}
            >
              Takıma Geri Dön
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmName('');
          setError('');
        }}
        onConfirm={handleDeleteTeam}
        title="Takımı Sil"
        description={`"${team?.name}" takımını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        confirmVariant="destructive"
        isLoading={isDeletingTeam}
        requireTextConfirmation={true}
        confirmationText={team?.name || ''}
        inputValue={deleteConfirmName}
        onInputChange={setDeleteConfirmName}
        inputPlaceholder="Takım adını buraya yazın..."
      />
    </div>
  );
}
