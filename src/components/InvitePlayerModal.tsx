'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  username: string;
  full_name: string;
  positions: string[];
  availability_status: string;
}

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
}

interface TeamInvitation {
  id: number;
  team_id: number;
  invited_user_id: number;
  invited_by: number;
  status: string;
  message?: string;
  created_at: string;
}

interface InvitePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
}

export default function InvitePlayerModal({ isOpen, onClose, teamId, teamName }: InvitePlayerModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [usersResponse, playersResponse, invitationsResponse] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/teams/${teamId}/players`),
        fetch('/api/teams/invitations')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setTeamPlayers(playersData.players || []);
      }

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setTeamInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
    }
  }, [teamId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Filtrelenmiş kullanıcılar - zaten takımda olan veya davet edilmiş olanları çıkar
  const filteredUsers = users.filter(user => {
    // Takımda olan oyuncuları filtrele
    const isInTeam = teamPlayers.some(player => player.user_id === user.id && player.is_active);
    if (isInTeam) return false;

    // Zaten davet edilmiş olanları filtrele
    const isAlreadyInvited = teamInvitations.some(invitation => 
      invitation.invited_user_id === user.id && 
      invitation.team_id === teamId && 
      invitation.status === 'pending'
    );
    if (isAlreadyInvited) return false;

    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Lütfen bir kullanıcı seçin');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          invited_user_id: selectedUser,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'success',
          title: 'Başarılı!',
          message: 'Davet başarıyla gönderildi',
          duration: 3000
        });
        setSelectedUser(null);
        setMessage('');
        // Verileri yenile
        fetchData();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorMessage = data.error || 'Davet gönderilemedi';
        (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
          type: 'error',
          title: 'Hata!',
          message: errorMessage,
          duration: 4000
        });
        setError(errorMessage);
      }
    } catch {
      const errorMessage = 'Davet gönderilemedi';
      (window as { showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void }).showToast?.({
        type: 'error',
        title: 'Hata!',
        message: errorMessage,
        duration: 4000
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
        return 'text-green-600 bg-green-100';
      case 'unavailable':
        return 'text-red-600 bg-red-100';
      case 'maybe':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Mevkileri sıralı hale getiren yardımcı fonksiyon
  const getSortedPositions = (positions: string[]) => {
    const positionOrder = [
      'Kaleci',
      'Sağ Bek',
      'Stoper',
      'Sol Bek',
      'Defansif Orta Saha',
      'Orta Saha',
      '10 Numara',
      'Sağ Kanat',
      'Sol Kanat',
      'Forvet'
    ];
    
    return positions.sort((a, b) => {
      const indexA = positionOrder.indexOf(a);
      const indexB = positionOrder.indexOf(b);
      return indexA - indexB;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Oyuncu Davet Et - {teamName}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kullanıcı Seçimi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Davet Edilecek Kullanıcı
              </label>
              <select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(Number(e.target.value) || null)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                required
              >
                <option value="">Kullanıcı seçin</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} (@{user.username}) - {user.positions.length > 0 ? getSortedPositions(user.positions).join(', ') : 'Mevki belirtilmemiş'}
                  </option>
                ))}
              </select>
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Davet edilebilecek kullanıcı bulunmuyor. Tüm kullanıcılar zaten takımda veya davet edilmiş.
                </p>
              )}
            </div>

            {/* Seçili Kullanıcı Bilgileri */}
            {selectedUser && (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h3 className="font-medium text-foreground mb-2">Seçili Kullanıcı Bilgileri</h3>
                {(() => {
                  const user = users.find(u => u.id === selectedUser);
                  if (!user) return null;
                  
                  return (
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground"><span className="font-medium">Ad:</span> {user.full_name}</p>
                      <p className="text-foreground"><span className="font-medium">Kullanıcı Adı:</span> @{user.username}</p>
                      <p className="text-foreground">
                        <span className="font-medium">Mevkiler:</span> 
                        {user.positions.length > 0 ? getSortedPositions(user.positions).join(', ') : 'Mevki belirtilmemiş'}
                      </p>
                      <p className="text-foreground">
                        <span className="font-medium">Uygunluk:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getAvailabilityStatusColor(user.availability_status)}`}>
                          {getAvailabilityStatusText(user.availability_status)}
                        </span>
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Mesaj */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Davet Mesajı (İsteğe bağlı)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
                placeholder="Davet mesajınızı yazın..."
              />
            </div>

            {/* Butonlar */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedUser}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Gönderiliyor...' : 'Davet Gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 