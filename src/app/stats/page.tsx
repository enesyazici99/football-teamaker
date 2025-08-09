'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

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
  positions?: string[];
  availability_status?: string;
  average_rating?: number;
  total_matches?: number;
}

export default function StatsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Players fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart için sample data oluştur (gerçek veriler gelene kadar)
  const performanceData = [
    { month: 'Ocak', ortalamaPuan: 7.2, maçSayısı: 12 },
    { month: 'Şubat', ortalamaPuan: 7.5, maçSayısı: 15 },
    { month: 'Mart', ortalamaPuan: 7.8, maçSayısı: 18 },
    { month: 'Nisan', ortalamaPuan: 8.1, maçSayısı: 22 },
    { month: 'Mayıs', ortalamaPuan: 8.3, maçSayısı: 20 },
    { month: 'Haziran', ortalamaPuan: 8.5, maçSayısı: 25 },
  ];

  // Oyuncu bazlı performans verisi
  const playerPerformanceData = players.slice(0, 10).map(player => ({
    name: player.full_name.split(' ')[0],
    puan: player.average_rating || Math.random() * 3 + 7, // Örnek veri
    beceri: player.skill_level,
  }));

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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">İstatistikler</h1>
            <p className="text-lg text-muted-foreground">
              Takım ve oyuncu performans istatistiklerini görüntüleyin.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ayarlar
          </Link>
        </div>

        {/* Genel İstatistikler */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="card-dark">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">👥</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Oyuncu</p>
                  <p className="text-2xl font-bold text-foreground">{players.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">✅</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktif Oyuncu</p>
                  <p className="text-2xl font-bold text-foreground">
                    {players.filter(p => p.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ortalama Puan</p>
                  <p className="text-2xl font-bold text-foreground">
                    {players.length > 0 
                      ? (players.reduce((sum, p) => sum + (p.average_rating || 0), 0) / players.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">⚽</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Maç</p>
                  <p className="text-2xl font-bold text-foreground">
                    {players.reduce((sum, p) => sum + (p.total_matches || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Oyuncu İstatistikleri */}
        <Card className="card-dark mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Oyuncu Performans İstatistikleri
            </CardTitle>
            <CardDescription>
              Her oyuncunun detaylı performans verileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Oyuncu</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Mevkiler</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Beceri</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Ortalama Puan</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Maç Sayısı</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{player.full_name}</p>
                          <p className="text-sm text-muted-foreground">@{player.username}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-foreground">
                          {player.positions && player.positions.length > 0 
                            ? player.positions.join(', ') 
                            : 'Belirtilmemiş'
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-foreground">
                          {player.skill_level}/10
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-foreground">
                          {(player.average_rating || 0).toFixed(1)}/10
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-foreground">
                          {player.total_matches || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          player.is_active 
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {player.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performans Grafikleri */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Zaman Bazlı Performans Grafiği */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Aylık Performans Trendi
              </CardTitle>
              <CardDescription>
                Takımın aylık ortalama performans puanı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorPuan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    domain={[0, 10]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ortalamaPuan" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorPuan)"
                    strokeWidth={2}
                    name="Ortalama Puan"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Oyuncu Bazlı Performans Karşılaştırma */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Oyuncu Performans Karşılaştırması
              </CardTitle>
              <CardDescription>
                En iyi 10 oyuncunun puan ortalamaları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    domain={[0, 10]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="puan" 
                    fill="#10b981" 
                    name="Ortalama Puan"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}