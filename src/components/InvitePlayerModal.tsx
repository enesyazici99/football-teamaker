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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Takım oyuncularını ve davetleri getir
  const fetchTeamData = useCallback(async () => {
    try {
      const [playersResponse, invitationsResponse, userResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/players`),
        fetch(`/api/teams/${teamId}/invitations`),
        fetch('/api/auth/me')
      ]);

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setTeamPlayers(playersData.players || []);
      }

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setTeamInvitations(invitationsData.invitations || []);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.user?.id || null);
      }
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
    }
  }, [teamId]);

  useEffect(() => {
    if (isOpen) {
      fetchTeamData();
    }
  }, [isOpen, fetchTeamData]);

  // Kullanıcı araması yap
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        // Filtreleme: kendini, takımda olanları ve zaten davet edilenleri çıkar
        const filteredUsers = users.filter((user: User) => {
          // Kendi kendini davet etmeyi engelle
          if (user.id === currentUserId) return false;
          
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
        
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setIsSearching(false);
    }
  }, [currentUserId, teamPlayers, teamInvitations, teamId]);

  // Debounced arama
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

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
          invited_user_id: selectedUser.id,
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
        setSearchQuery('');
        setSearchResults([]);
        // Verileri yenile
        fetchTeamData();
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
            {/* Kullanıcı Arama */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kullanıcı Ara
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="İsim veya kullanıcı adı yazın (en az 3 harf)..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <p className="text-sm text-muted-foreground mt-2">
                  En az 3 harf yazın
                </p>
              )}

              {/* Arama Sonuçları */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg bg-background">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchQuery(user.full_name);
                        setSearchResults([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          {user.positions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {getSortedPositions(user.positions).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getAvailabilityStatusColor(user.availability_status)}`}>
                          {getAvailabilityStatusText(user.availability_status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-muted-foreground mt-2">
                  Kullanıcı bulunamadı veya tüm eşleşen kullanıcılar zaten takımda/davet edilmiş.
                </p>
              )}
            </div>

            {/* Seçili Kullanıcı Bilgileri */}
            {selectedUser && (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-foreground">Seçili Kullanıcı</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchQuery('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground"><span className="font-medium">Ad:</span> {selectedUser.full_name}</p>
                  <p className="text-foreground"><span className="font-medium">Kullanıcı Adı:</span> @{selectedUser.username}</p>
                  <p className="text-foreground">
                    <span className="font-medium">Mevkiler:</span> 
                    {selectedUser.positions.length > 0 ? ' ' + getSortedPositions(selectedUser.positions).join(', ') : ' Mevki belirtilmemiş'}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium">Uygunluk:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getAvailabilityStatusColor(selectedUser.availability_status)}`}>
                      {getAvailabilityStatusText(selectedUser.availability_status)}
                    </span>
                  </p>
                </div>
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