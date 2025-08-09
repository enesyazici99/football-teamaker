'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import TeamNavigation from '@/components/TeamNavigation';
import { X } from 'lucide-react';

interface Player {
  id: number; // players tablosundaki id
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

interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  captain_id?: number;
  team_size: number;
  created_at: string;
  authorized_members?: number[];
}

interface Position {
  id: string;
  name: string;
  x: number;
  y: number;
  player?: Player;
}



interface FormationOption {
  name: string;
  description: string;
}

interface User {
  id: number;
  full_name: string;
  username: string;
}

// Formasyon yardımcı fonksiyonları
const getAvailableFormations = (teamSize: number): FormationOption[] => {
  switch (teamSize) {
    case 6:
      return [
        { name: '3-1-1', description: '3 Defans, 1 Orta Saha, 1 Forvet' },
        { name: '2-2-1', description: '2 Defans, 2 Orta Saha, 1 Forvet' },
        { name: '3-2', description: '3 Defans, 2 Orta Saha' }
      ];
    case 7:
      return [
        { name: '3-2-1', description: '3 Defans, 2 Orta Saha, 1 Forvet' },
        { name: '2-3-1', description: '2 Defans, 3 Orta Saha, 1 Forvet' },
        { name: '3-3', description: '3 Defans, 3 Orta Saha' }
      ];
    case 8:
      return [
        { name: '3-3-1', description: '3 Defans, 3 Orta Saha, 1 Forvet' },
        { name: '2-4-1', description: '2 Defans, 4 Orta Saha, 1 Forvet' },
        { name: '3-4', description: '3 Defans, 4 Orta Saha' }
      ];
    case 9:
      return [
        { name: '3-4-1', description: '3 Defans, 4 Orta Saha, 1 Forvet' },
        { name: '2-5-1', description: '2 Defans, 5 Orta Saha, 1 Forvet' },
        { name: '3-5', description: '3 Defans, 5 Orta Saha' }
      ];
    case 10:
      return [
        { name: '3-5-1', description: '3 Defans, 5 Orta Saha, 1 Forvet' },
        { name: '2-6-1', description: '2 Defans, 6 Orta Saha, 1 Forvet' },
        { name: '3-6', description: '3 Defans, 6 Orta Saha' }
      ];
    case 11:
      return [
        { name: '3-6-1', description: '3 Defans, 6 Orta Saha, 1 Forvet' },
        { name: '2-7-1', description: '2 Defans, 7 Orta Saha, 1 Forvet' },
        { name: '3-7', description: '3 Defans, 7 Orta Saha' }
      ];
    default:
      return [
        { name: '3-3-1', description: '3 Defans, 3 Orta Saha, 1 Forvet' }
      ];
  }
};

const calculatePositions = (formationName: string): Array<{ id: string; name: string; x: number; y: number }> => {
  const positions: Array<{ id: string; name: string; x: number; y: number }> = [];
  
  // Kaleci - her zaman sabit
  positions.push({ id: 'gk', name: 'Kaleci', x: 50, y: 92 });
  
  // Formasyon adını parçala (örn: "3-3-1" -> [3, 3, 1])
  const formationParts = formationName.split('-').map(Number);
  
  if (formationParts.length === 3) {
    // 3 parçalı formasyon: 3-3-1 gibi (defans, orta saha, forvet)
    const [def, mid, fwd] = formationParts;
    
    // Defans pozisyonları
    if (def === 2) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    } else if (def === 3) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'cb', name: 'Stoper', x: 50, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    }
    
    // Orta saha pozisyonları
    if (mid === 1) {
      positions.push({ id: 'cm', name: 'Orta Saha', x: 50, y: 50 });
    } else if (mid === 2) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 30, y: 50 });
    } else if (mid === 3) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 20, y: 50 });
    } else if (mid === 4) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 85, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 15, y: 50 });
    } else if (mid === 5) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 30, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 6) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 75, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 25, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 7) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 95, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 65, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 35, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 20, y: 50 });
      positions.push({ id: 'cm7', name: 'Orta Saha', x: 5, y: 50 });
    }
    
    // Forvet pozisyonları
    if (fwd === 1) {
      positions.push({ id: 'st', name: 'Forvet', x: 50, y: 25 });
    }
  } else if (formationParts.length === 2) {
    // 2 parçalı formasyon: 3-3 gibi (defans, orta saha)
    const [def, mid] = formationParts;
    
    // Defans pozisyonları
    if (def === 2) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    } else if (def === 3) {
      positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
      positions.push({ id: 'cb', name: 'Stoper', x: 50, y: 75 });
      positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
    }
    
    // Orta saha pozisyonları
    if (mid === 1) {
      positions.push({ id: 'cm', name: 'Orta Saha', x: 50, y: 50 });
    } else if (mid === 2) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 30, y: 50 });
    } else if (mid === 3) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 20, y: 50 });
    } else if (mid === 4) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 85, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 15, y: 50 });
    } else if (mid === 5) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 70, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 30, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 6) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 75, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 60, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 40, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 25, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 10, y: 50 });
    } else if (mid === 7) {
      positions.push({ id: 'cm1', name: 'Orta Saha', x: 95, y: 50 });
      positions.push({ id: 'cm2', name: 'Orta Saha', x: 80, y: 50 });
      positions.push({ id: 'cm3', name: 'Orta Saha', x: 65, y: 50 });
      positions.push({ id: 'cm4', name: 'Orta Saha', x: 50, y: 50 });
      positions.push({ id: 'cm5', name: 'Orta Saha', x: 35, y: 50 });
      positions.push({ id: 'cm6', name: 'Orta Saha', x: 20, y: 50 });
      positions.push({ id: 'cm7', name: 'Orta Saha', x: 5, y: 50 });
    }
  }
  
  return positions;
};

export default function TeamFormationPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [_availableFormations, setAvailableFormations] = useState<FormationOption[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hoveredPositionId, setHoveredPositionId] = useState<string | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [draggedFromPosition, setDraggedFromPosition] = useState<string | null>(null);
  const [touchedPlayer, setTouchedPlayer] = useState<Player | null>(null);
  const [touchedFromPosition, setTouchedFromPosition] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const fetchTeamData = useCallback(async () => {
    try {
      const [teamResponse, playersResponse, formationResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/players`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/formation`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
        
        // Takım boyutuna göre mevcut formasyonları al
        const formations = getAvailableFormations(teamData.team.team_size);
        setAvailableFormations(formations);
      }

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(playersData.players);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }

      if (formationResponse.ok) {
        const formationData = await formationResponse.json();
        console.log('Formasyon verisi:', formationData); // Debug için
        
        setSelectedFormation(formationData.formation.name);
        
        // Pozisyonları ayarla
        const calculatedPositions = calculatePositions(formationData.formation.name);
        const positionsWithPlayers = calculatedPositions.map(pos => {
          const savedPosition = formationData.positions.find((sp: { id: string, player?: Player }) => sp.id === pos.id);
          return {
            ...pos,
            player: savedPosition?.player || null
          };
        });
        
        console.log('Hesaplanan pozisyonlar:', calculatedPositions); // Debug için
        console.log('Oyuncularla pozisyonlar:', positionsWithPlayers); // Debug için
        
        setPositions(positionsWithPlayers);
      } else {
        // Formasyon yoksa varsayılan pozisyonları ayarla
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const formations = getAvailableFormations(teamData.team.team_size);
          if (formations.length > 0) {
            const defaultFormation = formations[0].name;
            setSelectedFormation(defaultFormation);
            const calculatedPositions = calculatePositions(defaultFormation);
            setPositions(calculatedPositions);
          }
        }
      }
    } catch (error) {
      console.error('Takım bilgileri yüklenemedi:', error);
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

  // Mobil cihaz kontrolü
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(isTouchDevice);
    };
    
    // İlk kontrol
    checkMobile();
    
    // Değişiklikleri dinle
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const handleChange = () => checkMobile();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Formasyon değiştiğinde pozisyonları güncelle
  useEffect(() => {
    if (selectedFormation && !isLoading) {
      const newPositions = calculatePositions(selectedFormation);
      // Mevcut oyuncuları koru
      setPositions(prevPositions => {
        return newPositions.map(newPos => {
          const existingPos = prevPositions.find(p => p.id === newPos.id);
          return {
            ...newPos,
            player: existingPos?.player
          };
        });
      });
    }
  }, [selectedFormation, isLoading]);

  const handlePositionClick = (position: Position) => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || 
                                (team?.captain_id === currentUser?.id) || 
                                (team?.authorized_members?.includes(currentUser?.id || 0) || false);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Pozisyon değiştirmek için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    // Eğer pozisyonda oyuncu varsa, oyuncuyu kaldır
    if (position.player) {
      const updatedPositions = positions.map(pos => 
        pos.id === position.id 
          ? { ...pos, player: undefined }
          : pos
      );
      setPositions(updatedPositions);
      return;
    }

    // Eğer bir oyuncu seçiliyse, oyuncuyu pozisyona yerleştir
    if (selectedPlayer) {
      const updatedPositions = positions.map(pos => 
        pos.id === position.id 
          ? { ...pos, player: selectedPlayer }
          : pos.player?.id === selectedPlayer.id 
            ? { ...pos, player: undefined }
            : pos
      );
      setPositions(updatedPositions);
      setSelectedPlayer(null);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || 
                                (team?.captain_id === currentUser?.id) || 
                                (team?.authorized_members?.includes(currentUser?.id || 0) || false);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Oyuncu seçmek için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    setSelectedPlayer(player);
  };

  const handleFormationChange = (formationName: string) => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || 
                                (team?.captain_id === currentUser?.id) || 
                                (team?.authorized_members?.includes(currentUser?.id || 0) || false);
    
    if (!currentIsAuthorized) {
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Formasyon değiştirmek için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    setSelectedFormation(formationName);
  };

  // Drag & Drop fonksiyonları
  const handleDragStart = (e: React.DragEvent, player: Player, fromPositionId?: string) => {
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || 
                                (team?.captain_id === currentUser?.id) || 
                                (team?.authorized_members?.includes(currentUser?.id || 0) || false);
    
    if (!currentIsAuthorized) return;
    
    setDraggedPlayer(player);
    if (fromPositionId) {
      setDraggedFromPosition(fromPositionId);
      // Sahadan sürükleniyorsa hover'ı kapat
      setHoveredPositionId(null);
    }
    
    // Özel drag image oluştur
    const dragImage = document.createElement('div');
    dragImage.id = 'custom-drag-image';
    dragImage.style.position = 'fixed';
    dragImage.style.width = '64px';
    dragImage.style.height = '64px';
    dragImage.style.borderRadius = '50%';
    dragImage.style.backgroundColor = '#3b82f6';
    dragImage.style.border = '2px solid #2563eb';
    dragImage.style.display = 'flex';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.style.color = 'white';
    dragImage.style.fontSize = '12px';
    dragImage.style.fontWeight = 'bold';
    dragImage.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.zIndex = '9999';
    dragImage.innerHTML = player.full_name.split(' ')[0];
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 32, 32);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPositionId: string) => {
    e.preventDefault();
    
    if (!draggedPlayer) return;
    
    const updatedPositions = positions.map(pos => {
      // Hedef pozisyon
      if (pos.id === targetPositionId) {
        return { ...pos, player: draggedPlayer };
      }
      // Eski pozisyonu temizle
      if (draggedFromPosition && pos.id === draggedFromPosition) {
        return { ...pos, player: undefined };
      }
      // Diğer pozisyonlardan da temizle (eğer aynı oyuncu başka yerdeyse)
      if (!draggedFromPosition && pos.player?.id === draggedPlayer.id) {
        return { ...pos, player: undefined };
      }
      return pos;
    });
    
    setPositions(updatedPositions);
    setDraggedPlayer(null);
    setDraggedFromPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setDraggedFromPosition(null);
    
    // Drag image'ı temizle
    const existingDragImage = document.getElementById('custom-drag-image');
    if (existingDragImage) {
      existingDragImage.remove();
    }
  };

  // Mobil touch eventleri
  const handleTouchStart = (e: React.TouchEvent, player: Player, fromPositionId?: string) => {
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || 
                                (team?.captain_id === currentUser?.id) || 
                                (team?.authorized_members?.includes(currentUser?.id || 0) || false);
    
    if (!currentIsAuthorized) return;
    
    e.preventDefault();
    e.stopPropagation();
    setTouchedPlayer(player);
    if (fromPositionId) {
      setTouchedFromPosition(fromPositionId);
      // Sahadan sürükleniyorsa hover'ı kapat
      setHoveredPositionId(null);
    }
    
    // Sürükleme göstergesi için özel bir yuvarlak element oluştur
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    
    // Yuvarlak sürükleme elementi oluştur
    const dragElement = document.createElement('div');
    dragElement.id = 'drag-clone';
    dragElement.className = 'fixed bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-blue-600';
    dragElement.style.position = 'fixed';
    dragElement.style.zIndex = '9999';
    dragElement.style.left = `${touch.clientX - 32}px`;
    dragElement.style.top = `${touch.clientY - 32}px`;
    dragElement.style.pointerEvents = 'none';
    dragElement.style.opacity = '0.9';
    dragElement.style.transform = 'scale(0.95)';
    
    // Oyuncu bilgisini ekle
    const nameDiv = document.createElement('div');
    nameDiv.className = 'text-center';
    nameDiv.innerHTML = `
      <div class="text-xs font-bold truncate max-w-12">
        ${player.full_name.split(' ')[0]}
      </div>
    `;
    dragElement.appendChild(nameDiv);
    
    document.body.appendChild(dragElement);
    
    // Orijinal elementi yarı saydam yap
    element.style.opacity = '0.3';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchedPlayer) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const dragElement = document.getElementById('drag-clone');
    
    if (dragElement) {
      dragElement.style.left = `${touch.clientX - 32}px`;
      dragElement.style.top = `${touch.clientY - 32}px`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchedPlayer) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.changedTouches[0];
    const element = e.currentTarget as HTMLElement;
    
    // Orijinal elementi normale döndür
    element.style.opacity = '';
    
    // Sürükleme elementini kaldır
    const dragElement = document.getElementById('drag-clone');
    if (dragElement) {
      dragElement.remove();
    }
    
    // Saha alanını bul
    const fieldElement = document.querySelector('.bg-green-600');
    if (!fieldElement) {
      setTouchedPlayer(null);
      setTouchedFromPosition(null);
      return;
    }
    
    const fieldRect = fieldElement.getBoundingClientRect();
    
    // Touch noktası saha içinde mi kontrol et
    if (touch.clientX >= fieldRect.left && 
        touch.clientX <= fieldRect.right && 
        touch.clientY >= fieldRect.top && 
        touch.clientY <= fieldRect.bottom) {
      
      // En yakın pozisyonu bul
      const touchRelativeX = ((touch.clientX - fieldRect.left) / fieldRect.width) * 100;
      const touchRelativeY = ((touch.clientY - fieldRect.top) / fieldRect.height) * 100;
      
      let closestPositionId: string | null = null;
      let closestDistance = Infinity;
      
      positions.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - touchRelativeX, 2) + 
          Math.pow(pos.y - touchRelativeY, 2)
        );
        
        if (distance < closestDistance && distance < 20) { // 20% yakınlık eşiği
          closestDistance = distance;
          closestPositionId = pos.id;
        }
      });
      
      if (closestPositionId) {
        handleMobileDrop(closestPositionId);
      }
    }
    
    setTouchedPlayer(null);
    setTouchedFromPosition(null);
  };

  const handleMobileDrop = (targetPositionId: string) => {
    if (!touchedPlayer) return;
    
    const updatedPositions = positions.map(pos => {
      // Hedef pozisyon
      if (pos.id === targetPositionId) {
        return { ...pos, player: touchedPlayer };
      }
      // Eski pozisyonu temizle
      if (touchedFromPosition && pos.id === touchedFromPosition) {
        return { ...pos, player: undefined };
      }
      // Diğer pozisyonlardan da temizle (eğer aynı oyuncu başka yerdeyse)
      if (!touchedFromPosition && pos.player?.id === touchedPlayer.id) {
        return { ...pos, player: undefined };
      }
      return pos;
    });
    
    setPositions(updatedPositions);
  };

  const handleSaveFormation = async () => {
    // Yetki kontrolü - team ve currentUser yüklendiğinden emin ol
    const currentIsAuthorized = (team?.created_by === currentUser?.id) || 
                                (team?.captain_id === currentUser?.id) || 
                                (team?.authorized_members?.includes(currentUser?.id || 0) || false);
    
    if (!currentIsAuthorized) {
      console.log('Kaydetme yetki kontrolü:', {
        teamOwnerId: team?.created_by,
        currentUserId: currentUser?.id,
        teamCaptainId: team?.captain_id,
        authorizedMembers: team?.authorized_members,
        currentIsAuthorized
      });
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Yetki Hatası!',
        message: 'Bu işlem için yetkiniz bulunmuyor',
        duration: 4000
      });
      return;
    }

    setIsSaving(true);
    try {
      // Sadece oyuncu atanmış pozisyonları filtrele
      const positionsWithPlayers = positions.filter(pos => pos.player);
      
      console.log('Kaydedilecek pozisyonlar:', positionsWithPlayers); // Debug için
      
      const response = await fetch(`/api/teams/${teamId}/formation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          formation_name: selectedFormation,
          team_size: team?.team_size || 11,
          positions: positionsWithPlayers
        })
      });

      if (response.ok) {
        (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
          type: 'success',
          title: 'Başarılı!',
          message: 'Formasyon ve mevkilendirme başarıyla kaydedildi',
          duration: 3000
        });
        // Sayfayı yenile
        fetchTeamData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Formasyon kaydedilemedi');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Formasyon kaydedilemedi';
      setError(errorMessage);
      (window as unknown as { showToast: (toast: { type: string, title: string, message: string, duration: number }) => void }).showToast({
        type: 'error',
        title: 'Hata!',
        message: `Formasyon kaydedilemedi: ${errorMessage}`,
        duration: 4000
      });
    } finally {
      setIsSaving(false);
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

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Takım bulunamadı</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </div>
    );
  }

  // Takım sahibi veya yetkili üye kontrolü
  const isTeamOwner = team?.created_by === currentUser?.id;
  const isCaptain = team?.captain_id === currentUser?.id;
  const isInAuthorizedMembers = team?.authorized_members?.includes(currentUser?.id || 0) || false;
  const isAuthorized = isTeamOwner || isCaptain || isInAuthorizedMembers;
  const isTeamMember = players.some(player => player.user_id === currentUser?.id && player.is_active);
  
  // Debug için
  console.log('Yetki Kontrolü:', {
    teamId: team?.id,
    teamOwnerId: team?.created_by,
    teamCaptainId: team?.captain_id,
    authorizedMembers: team?.authorized_members,
    currentUserId: currentUser?.id,
    isTeamOwner,
    isCaptain,
    isInAuthorizedMembers,
    isAuthorized,
    isTeamMember
  });

  // Kullanıcının takımda oyuncu olup olmadığını kontrol et
  if (!isTeamOwner && !isAuthorized && !isTeamMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Bu takıma erişim yetkiniz yok</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar teamId={teamId} teamName={team.name} isAuthorized={isAuthorized} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{team.name} - Mevkilendirme</h1>
                {team.description && (
                  <p className="text-lg text-muted-foreground mt-2">{team.description}</p>
                )}
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

          {/* Navigation */}
          <TeamNavigation teamId={teamId} isAuthorized={isAuthorized} />

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formasyon Seçimi ve Saha */}
            <div className="space-y-6">
              {/* Formasyon Seçimi */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Formasyon Seçimi
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {isAuthorized 
                      ? 'Takım boyutuna uygun formasyon seçin'
                      : 'Sadece yetkili kişiler formasyon değiştirebilir'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {getAvailableFormations(team.team_size).map((formation) => (
                      <Button
                        key={formation.name}
                        variant={selectedFormation === formation.name ? "default" : "outline"}
                        onClick={() => handleFormationChange(formation.name)}
                        disabled={!isAuthorized}
                        className="text-sm"
                      >
                        <div className="text-center">
                          <div className="font-semibold">{formation.name}</div>
                          <div className="text-xs opacity-75">{formation.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Saha */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Saha Dizilimi
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedPlayer 
                      ? `${selectedPlayer.full_name} için pozisyon seçin`
                      : isAuthorized 
                        ? 'Oyuncu seçin veya sürükleyerek yerleştirin'
                        : 'Mevcut dizilimi görüntülüyorsunuz'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-green-600 rounded-lg p-4 h-96">
                    {/* Saha çizgileri */}
                    <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
                    
                    {/* Orta saha çizgisi (yatay) */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white"></div>
                    
                    {/* Orta saha yuvarlağı */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Orta nokta */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Sol kale (üst kale) */}
                    <div className="absolute top-4 left-1/2 w-8 h-2 bg-white transform -translate-x-1/2"></div>
                    <div className="absolute top-2 left-1/2 w-12 h-4 border-2 border-white transform -translate-x-1/2"></div>
                    
                    {/* Sağ kale (alt kale) */}
                    <div className="absolute bottom-4 left-1/2 w-8 h-2 bg-white transform -translate-x-1/2"></div>
                    <div className="absolute bottom-2 left-1/2 w-12 h-4 border-2 border-white transform -translate-x-1/2"></div>
                    
                    {/* Üst ceza sahası */}
                    <div className="absolute top-4 left-1/4 w-1/2 h-8 border-b-2 border-white"></div>
                    
                    {/* Alt ceza sahası */}
                    <div className="absolute bottom-4 left-1/4 w-1/2 h-8 border-t-2 border-white"></div>
                    
                    {/* Üst ceza noktası */}
                    <div className="absolute top-12 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2"></div>
                    
                    {/* Alt ceza noktası */}
                    <div className="absolute bottom-12 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2"></div>
                    
                    {/* Pozisyonlar */}
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        data-position-id={position.id}
                        onPointerDown={(e) => {
                          // Mobilde kullan
                          if (!isMobile) return;
                          e.preventDefault();
                          e.stopPropagation();
                          handlePositionClick(position);
                        }}
                        onClick={() => {
                          // Web'de kullan
                          if (isMobile) return;
                          handlePositionClick(position);
                        }}
                        onMouseEnter={() => !isMobile && position.player && setHoveredPositionId(position.id)}
                        onMouseLeave={() => !isMobile && setHoveredPositionId(null)}
                        onDragOver={!isMobile ? handleDragOver : undefined}
                        onDrop={!isMobile ? (e) => handleDrop(e, position.id) : undefined}
                        draggable={!isMobile && position.player && isAuthorized}
                        onDragStart={!isMobile ? (e) => {
                          if (position.player) {
                            handleDragStart(e, position.player, position.id);
                            // Sürükleme başladığında opacity ayarla
                            (e.currentTarget as HTMLElement).style.opacity = '0.4';
                          }
                        } : undefined}
                        onDragEnd={!isMobile ? (e) => {
                          handleDragEnd();
                          // Sürükleme bittiğinde opacity'yi normale döndür
                          (e.currentTarget as HTMLElement).style.opacity = '';
                        } : undefined}
                        onTouchStart={isMobile && position.player && isAuthorized && !selectedPlayer ? (e) => handleTouchStart(e, position.player!, position.id) : undefined}
                        onTouchMove={isMobile && position.player && isAuthorized && !selectedPlayer ? handleTouchMove : undefined}
                        onTouchEnd={isMobile && position.player && isAuthorized && !selectedPlayer ? handleTouchEnd : undefined}
                        className={`absolute w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                          position.player
                            ? hoveredPositionId === position.id && isAuthorized
                              ? 'bg-red-500 border-red-600 text-white shadow-lg cursor-move'
                              : 'bg-blue-500 border-blue-600 text-white shadow-lg'
                            : draggedPlayer
                              ? 'bg-green-100 border-green-400 hover:bg-green-200'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        } ${isAuthorized ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-75'}`}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {position.player ? (
                          <>
                            {/* Normal görünüm veya hover durumu */}
                            {hoveredPositionId === position.id && isAuthorized && !touchedPlayer && !draggedPlayer && !touchedFromPosition ? (
                              <div className="flex flex-col items-center justify-center">
                                <X className="w-8 h-8 text-white opacity-90" />
                                <span className="text-xs mt-1">Kaldır</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="text-xs font-bold truncate max-w-12">
                                  {position.player.full_name.split(' ')[0]}
                                </div>
                                <div className="text-xs opacity-75">{position.name}</div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="text-xs font-bold">{position.name}</div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Takım boyutu bilgisi */}
                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                      {team.team_size} Kişilik Takım
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Oyuncu Listesi ve Kaydet Butonu */}
            <div className="space-y-6">
              {/* Oyuncu Listesi */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Oyuncular ({players.length})
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedPlayer ? 'Pozisyona yerleştirmek için sahada bir pozisyona tıklayın' : 'Oyuncu seçin'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players.map((player) => {
                      // Oyuncunun sahada olup olmadığını kontrol et
                      const isPlayerOnField = positions.some(pos => pos.player?.id === player.id);
                      
                      return (
                        <div
                          key={player.id}
                          onPointerDown={(e) => {
                            // Hem touch hem mouse için çalışır
                            if (!isAuthorized) return;
                            if (!isMobile) return; // Web'de sadece onClick kullan
                            e.preventDefault();
                            e.stopPropagation();
                            handlePlayerSelect(player);
                          }}
                          onClick={(e) => {
                            // Web için
                            if (!isAuthorized) return;
                            if (isMobile) return; // Mobilde sadece onPointerDown kullan
                            e.preventDefault();
                            e.stopPropagation();
                            handlePlayerSelect(player);
                          }}
                          draggable={!isMobile && isAuthorized && !isPlayerOnField}
                          onDragStart={!isMobile && !isPlayerOnField ? (e) => {
                            handleDragStart(e, player);
                            // Sürükleme başladığında opacity ayarla
                            (e.currentTarget as HTMLElement).style.opacity = '0.4';
                          } : undefined}
                          onDragEnd={!isMobile ? (e) => {
                            handleDragEnd();
                            // Sürükleme bittiğinde opacity'yi normale döndür
                            (e.currentTarget as HTMLElement).style.opacity = '';
                          } : undefined}
                          onTouchStart={isMobile && isAuthorized && !isPlayerOnField && !selectedPlayer ? (e) => handleTouchStart(e, player) : undefined}
                          onTouchMove={isMobile && isAuthorized && !isPlayerOnField && !selectedPlayer ? handleTouchMove : undefined}
                          onTouchEnd={isMobile && isAuthorized && !isPlayerOnField && !selectedPlayer ? handleTouchEnd : undefined}
                          className={`p-3 rounded-lg transition-colors border-2 ${
                            selectedPlayer?.id === player.id
                              ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400'
                              : isPlayerOnField
                                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                                : 'bg-muted/50 border-transparent hover:bg-muted'
                          } ${isAuthorized ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                        >
                          <div className="flex justify-between items-center pointer-events-none">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{player.full_name}</p>
                                {isPlayerOnField && (
                                  <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                                    Sahada
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                @{player.username}
                              </Badge>
                              {isPlayerOnField && (
                                <p className="text-xs text-green-600 font-medium dark:text-green-400 mt-1">
                                  Pozisyon: {positions.find(pos => pos.player?.id === player.id)?.name}
                                </p>
                              )}
                              {player.positions && player.positions.length > 0 && (
                                <p className="text-xs text-muted-foreground">Tercih: {player.positions.join(', ')}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {player.skill_level}/10
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Kaydet Butonu */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Kaydet
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {isAuthorized 
                      ? 'Formasyon ve mevkilendirmeyi kaydetmek için butona tıklayın'
                      : 'Sadece yetkili kişiler formasyon kaydedebilir'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSaveFormation}
                    disabled={isSaving || !isAuthorized}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-muted"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Formasyonu Kaydet'}
                  </Button>
                  {!isAuthorized && (
                    <Badge variant="outline" className="text-xs mt-2 w-full justify-center">
                      Bu işlem için yetkiniz bulunmuyor
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}