'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/navbar';
import ConfirmModal from '@/components/ConfirmModal';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  positions?: string[];
  availability_status?: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    positions: [] as string[],
    availability_status: 'available'
  });

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        router.push('/auth/login');
        return;
      }
      const userData = await response.json();
      console.log('User data from API:', userData.user); // Debug için
      setUser(userData.user);
      setFormData({
        full_name: userData.user.full_name || '',
        email: userData.user.email || '',
        username: userData.user.username || '',
        positions: userData.user.positions || [],
        availability_status: userData.user.availability_status || 'available'
      });
    } catch {
      setError('Kullanıcı bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.user);
        setSuccess('Profil başarıyla güncellendi');
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Profil güncellenemedi');
      }
    } catch {
      setError('Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setConfirmMessage('Çıkış yapmak istediğinizden emin misiniz?');
    setConfirmAction(() => async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        router.push('/auth/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
    setShowConfirmModal(true);
  };

  const handleCancelEdit = () => {
    if (isEditing) {
      setConfirmMessage('Düzenlemeleri iptal etmek istediğinizden emin misiniz? Kaydedilmemiş değişiklikler kaybolacak.');
      setConfirmAction(() => () => {
        setIsEditing(false);
        setFormData({
          full_name: user?.full_name || '',
          email: user?.email || '',
          username: user?.username || '',
          positions: user?.positions || [],
          availability_status: user?.availability_status || 'available'
        });
      });
      setShowConfirmModal(true);
    }
  };

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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Badge variant="destructive" className="mb-4">
            Kullanıcı bulunamadı
          </Badge>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Profil</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Hesap bilgilerinizi yönetin
                </p>
              </div>
              <div className="flex space-x-4">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Düzenle
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                >
                  Çıkış Yap
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

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-full justify-center">
                {success}
              </Badge>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Profil Bilgileri */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Profil Bilgileri
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Kişisel bilgileriniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-sm font-medium text-foreground">
                      Ad Soyad
                    </Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <Badge variant="secondary" className="mt-1">
                        {user.full_name}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      E-posta
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <Badge variant="secondary" className="mt-1">
                        {user.email}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-foreground">
                      Kullanıcı Adı
                    </Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <Badge variant="secondary" className="mt-1">
                        @{user.username}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="availability_status" className="text-sm font-medium text-foreground">
                      Müsaitlik Durumu
                    </Label>
                    {isEditing ? (
                      <select
                        id="availability_status"
                        value={formData.availability_status}
                        onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      >
                        <option value="available">Müsait</option>
                        <option value="unavailable">Müsait Değil</option>
                        <option value="maybe">Belki</option>
                      </select>
                    ) : (
                      <Badge className={`mt-1 ${getAvailabilityStatusColor(user.availability_status || 'available')}`}>
                        {getAvailabilityStatusText(user.availability_status || 'available')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pozisyonlar */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Pozisyonlar
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Tercih ettiğiniz mevkiler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isEditing ? (
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        Pozisyonlar (En fazla 3 tane)
                      </Label>
                      <div className="mt-2 space-y-2">
                        {['Kaleci', 'Stoper', 'Sağ Bek', 'Sol Bek', 'Orta Saha', 'Kanat', 'Forvet'].map((position) => (
                          <label key={position} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.positions.includes(position)}
                              onChange={(e) => {
                                if (e.target.checked && formData.positions.length < 3) {
                                  setFormData({
                                    ...formData,
                                    positions: [...formData.positions, position]
                                  });
                                } else if (!e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    positions: formData.positions.filter(p => p !== position)
                                  });
                                }
                              }}
                              className="rounded border-input"
                            />
                            <span className="text-sm text-foreground">{position}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {user.positions && user.positions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.positions.map((position) => (
                            <Badge key={position} variant="secondary">
                              {position}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline">
                          Pozisyon belirtilmemiş
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hesap Bilgileri */}
          <Card className="card-dark mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Hesap Bilgileri
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Hesap detayları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Badge variant="outline" className="text-sm">
                    Üyelik Tarihi:
                  </Badge>
                  <Badge variant="secondary" className="text-sm ml-2">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </Badge>
                </div>
                <div>
                  <Badge variant="outline" className="text-sm">
                    Kullanıcı ID:
                  </Badge>
                  <Badge variant="secondary" className="text-sm ml-2">
                    {user.id}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setShowConfirmModal(false);
        }}
        title="Onay"
        message={confirmMessage}
      />
    </div>
  );
} 