'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCog, 
  Calendar, 
  Shield, 
  Activity, 
  FileText,
  LogOut,
  BarChart3,
  Trash2
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalTeams: number;
  totalMatches: number;
  activeUsers: number;
  todayMatches: number;
  totalLogs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        credentials: 'include'
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const statCards = [
    {
      title: 'Toplam Kullanıcılar',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Kayıtlı kullanıcı sayısı'
    },
    {
      title: 'Toplam Takımlar',
      value: stats?.totalTeams || 0,
      icon: UserCog,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Oluşturulan takım sayısı'
    },
    {
      title: 'Toplam Maçlar',
      value: stats?.totalMatches || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: 'Planlanan maç sayısı'
    },
    {
      title: 'Aktif Kullanıcılar',
      value: stats?.activeUsers || 0,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'Son 7 gün içinde aktif'
    },
    {
      title: 'Bugünkü Maçlar',
      value: stats?.todayMatches || 0,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      description: 'Bugün planlanan maçlar'
    },
    {
      title: 'Sistem Logları',
      value: stats?.totalLogs || 0,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      description: 'Toplam log kayıtları'
    }
  ];

  const adminActions = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle ve sil',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      action: () => router.push('/admin/users')
    },
    {
      title: 'Takım Yönetimi',
      description: 'Takımları görüntüle ve sil',
      icon: UserCog,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      action: () => router.push('/admin/teams')
    },
    {
      title: 'Maç Yönetimi',
      description: 'Maçları görüntüle ve sil',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10',
      action: () => router.push('/admin/matches')
    },
    {
      title: 'Sistem Logları',
      description: 'Sistem aktivitelerini ve logları görüntüle',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
      action: () => router.push('/admin/logs')
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Panel yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h2>
          <p className="text-slate-400">Halısaha Takım Yöneticisi Admin Paneli</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Hızlı İşlemler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminActions.map((action, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group"
                onClick={action.action}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{action.title}</h4>
                  <p className="text-sm text-slate-400">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Sistem Bilgileri
            </CardTitle>
            <CardDescription className="text-slate-400">
              Sistemin genel durumu ve bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-sm">Sistem Durumu</p>
                <Badge className="bg-green-600 hover:bg-green-700 mt-2">Çevrimiçi</Badge>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-sm">Son Güncelleme</p>
                <p className="text-white mt-2">{new Date().toLocaleDateString('tr-TR')}</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-sm">Versiyon</p>
                <p className="text-white mt-2">v1.0.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
