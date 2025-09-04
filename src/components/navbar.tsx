'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import NotificationBell from '@/components/NotificationBell';
import { User, LogOut, Menu, X, Home, Users, Trophy, BarChart3, Settings } from 'lucide-react';

interface NavbarProps {
  teamId?: string;
  teamName?: string;
  isAuthorized?: boolean;
}

export default function Navbar({ teamId, teamName }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email: string; full_name: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Sol taraf - Logo ve takım adı */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div 
                className="h-8 w-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push('/dashboard')}
              >
                <span className="text-sm font-bold text-white">⚽</span>
              </div>
              {teamName && (
                <Badge variant="secondary" className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                  {teamName}
                </Badge>
              )}
            </div>

            {/* Desktop - merkez boş alan */}
            <div className="hidden lg:flex items-center justify-center flex-1">
            </div>

            {/* Sağ taraf - Kullanıcı menüsü (Desktop) */}
            <div className="hidden lg:flex items-center space-x-2">
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

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center space-x-2">
              <ThemeToggle />
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-16">
          <div className="p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {teamId && (
              <>
                <Button
                  variant={getButtonVariant(`/teams/${teamId}`)}
                  onClick={() => handleNavigation(`/teams/${teamId}`)}
                  className="w-full justify-start"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Takıma Dön
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/players`)}
                  onClick={() => handleNavigation(`/teams/${teamId}/players`)}
                  className="w-full justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Oyuncular
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/matches`)}
                  onClick={() => handleNavigation(`/teams/${teamId}/matches`)}
                  className="w-full justify-start"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Maçlar
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/formation`)}
                  onClick={() => handleNavigation(`/teams/${teamId}/formation`)}
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Mevkilendirme
                </Button>
                
                <Button
                  variant={getButtonVariant(`/teams/${teamId}/stats`)}
                  onClick={() => handleNavigation(`/teams/${teamId}/stats`)}
                  className="w-full justify-start"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  İstatistikler
                </Button>
              </>
            )}
            
            <div className="border-t border-border pt-2 mt-4">
              {currentUser && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleNavigation('/profile')}
                    className="w-full justify-start mb-2"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}