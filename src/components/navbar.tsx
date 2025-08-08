'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import NotificationBell from '@/components/NotificationBell';
import { User, LogOut } from 'lucide-react';

interface NavbarProps {
  teamId?: string;
  teamName?: string;
  isAuthorized?: boolean;
}

export default function Navbar({ teamId, teamName, isAuthorized }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email: string; full_name: string } | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getButtonVariant = (path: string) => {
    return isActive(path) ? "default" : "outline";
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Sol taraf - Logo ve takım adı */}
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">⚽</span>
            </div>
            {teamName && (
              <Badge variant="secondary" className="text-sm">
                {teamName}
              </Badge>
            )}
          </div>

          {/* Orta - Navigasyon butonları */}
          <div className="flex items-center space-x-2">
            <Button
              variant={getButtonVariant('/dashboard')}
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-xs"
            >
              Ana Sayfa
            </Button>
            
            {teamId && (
              <>
                <Button
                  variant={getButtonVariant(`/teams/${teamId}`)}
                  size="sm"
                  onClick={() => router.push(`/teams/${teamId}`)}
                  className="text-xs"
                >
                  Takıma Dön
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/players`)}
                  size="sm"
                  onClick={() => router.push(`/teams/${teamId}/players`)}
                  className="text-xs"
                >
                  Oyuncular
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/matches`)}
                  size="sm"
                  onClick={() => router.push(`/teams/${teamId}/matches`)}
                  className="text-xs"
                >
                  Maçlar
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/formation`)}
                  size="sm"
                  onClick={() => router.push(`/teams/${teamId}/formation`)}
                  className="text-xs"
                >
                  Mevkilendirme
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/stats`)}
                  size="sm"
                  onClick={() => router.push(`/teams/${teamId}/stats`)}
                  className="text-xs"
                >
                  İstatistikler
                </Button>
              </>
            )}
          </div>

          {/* Sağ taraf - Kullanıcı menüsü */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationBell />
            
            {currentUser && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/profile')}
                  className="text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  Profil
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Çıkış
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 