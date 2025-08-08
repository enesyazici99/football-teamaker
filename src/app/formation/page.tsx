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
}

export default function FormationPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mevkilendirme</h1>
          <p className="text-lg text-gray-600">
            Saha dizilimlerini ve oyuncu mevkilendirmelerini yapın.
          </p>
        </div>

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Saha Simülasyonu
            </CardTitle>
            <CardDescription>
              Oyuncularınızı sahada mevkilere yerleştirin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-600 rounded-lg p-8 relative min-h-[400px]">
              {/* Saha çizgileri */}
              <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
              <div className="absolute top-1/4 left-1/2 w-0.5 h-1/2 bg-white"></div>
              <div className="absolute bottom-1/4 left-1/2 w-0.5 h-1/2 bg-white"></div>
              
              {/* Mevki pozisyonları */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                GK
              </div>
              
              <div className="absolute top-1/4 left-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                RB
              </div>
              
              <div className="absolute top-1/4 right-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                LB
              </div>
              
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                CB
              </div>
              
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                CM
              </div>
              
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                CM
              </div>
              
              <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors">
                ST
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mevcut Oyuncular</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div key={player.id} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{player.full_name}</p>
                    <p className="text-sm text-gray-600">@{player.username}</p>
                    {player.positions && player.positions.length > 0 && (
                      <p className="text-xs text-gray-500">{player.positions.join(', ')}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    player.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {player.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 