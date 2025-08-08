'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const router = useRouter();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">İstatistikler</h1>
          <p className="text-lg text-gray-600">
            Takım ve oyuncu performans istatistiklerini görüntüleyin.
          </p>
        </div>

        {/* Genel İstatistikler */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">👥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Toplam Oyuncu</p>
                  <p className="text-2xl font-bold text-gray-900">{players.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">✅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aktif Oyuncu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {players.filter(p => p.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ortalama Puan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {players.length > 0 
                      ? (players.reduce((sum, p) => sum + (p.average_rating || 0), 0) / players.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-white">⚽</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Toplam Maç</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {players.reduce((sum, p) => sum + (p.total_matches || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Oyuncu İstatistikleri */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
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
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Oyuncu</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Mevkiler</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Beceri</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ortalama Puan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Maç Sayısı</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{player.full_name}</p>
                          <p className="text-sm text-gray-600">@{player.username}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {player.positions && player.positions.length > 0 
                            ? player.positions.join(', ') 
                            : 'Belirtilmemiş'
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-700">
                          {player.skill_level}/10
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-700">
                          {(player.average_rating || 0).toFixed(1)}/10
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {player.total_matches || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          player.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
      </div>
    </div>
  );
} 