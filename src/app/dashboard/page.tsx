'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }
        const userData = await response.json();
        setUser(userData.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                ⚽ Halısaha Takım Yöneticisi
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Hoş geldin, {user?.full_name}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h2>
          <p className="text-gray-600">
            Halısaha ekibinizi yönetmek için aşağıdaki seçenekleri kullanın.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">👥</span>
                Oyuncular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Oyuncularınızı yönetin ve pozisyonlarını ayarlayın.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">⚽</span>
                Maçlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Yeni maç planlayın ve mevcut maçları görüntüleyin.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                Mevkilendirme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Saha dizilimlerini ve oyuncu mevkilendirmelerini yapın.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">📊</span>
                İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Takım ve oyuncu performans istatistiklerini görüntüleyin.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Son Maçlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <p>Henüz maç kaydı bulunmuyor.</p>
                <Button className="mt-4" variant="outline">
                  İlk Maçı Planla
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oyuncu Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <p>Henüz oyuncu kaydı bulunmuyor.</p>
                <Button className="mt-4" variant="outline">
                  Oyuncu Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 