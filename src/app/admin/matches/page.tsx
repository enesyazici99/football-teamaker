'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ConfirmModal from '@/components/ConfirmModal';
import { 
  Calendar, 
  Search, 
  Trash2,
  Edit3,
  ArrowLeft,
  Shield,
  MapPin,
  Trophy,
  Clock,
  Users
} from 'lucide-react';

interface Match {
  id: number;
  team_id: number;
  team_name: string;
  opponent_team?: string;
  match_date: string;
  location?: string;
  status: string;
  home_score: number;
  away_score: number;
  created_at: string;
  created_by_name?: string;
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    // Filter matches based on search term and status
    let filtered = matches;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(match => match.status === selectedStatus);
    }

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(match =>
        match.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.opponent_team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMatches(filtered);
  }, [searchTerm, selectedStatus, matches]);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/admin/matches', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
        setFilteredMatches(data.matches);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Matches fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/matches/${matchToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setMatches(matches.filter(m => m.id !== matchToDelete.id));
        setShowDeleteModal(false);
        setMatchToDelete(null);
      } else {
        throw new Error('Maç silinemedi');
      }
    } catch (error) {
      console.error('Delete match error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'ongoing':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Planlandı</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Devam Ediyor</Badge>;
      case 'completed':
        return <Badge className="bg-green-600 hover:bg-green-700">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">İptal Edildi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('tr-TR'),
      time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Maçlar yükleniyor...</p>
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
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-600"></div>
              <Shield className="h-6 w-6 text-red-500" />
              <h1 className="text-xl font-bold text-white">Maç Yönetimi</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Maç ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 w-64"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="scheduled">Planlandı</option>
                <option value="ongoing">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-slate-300">
                <Calendar className="w-4 h-4 mr-2" />
                Toplam: {matches.length}
              </Badge>
              <Badge variant="outline" className="text-slate-300">
                Gösterilen: {filteredMatches.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
            const { date, time } = formatDate(match.match_date);
            return (
              <Card key={match.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">
                        {match.team_name} vs {match.opponent_team || 'Rakip Takım'}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {date} - {time}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(match.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Location */}
                    {match.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{match.location}</span>
                      </div>
                    )}

                    {/* Score (if completed) */}
                    {match.status === 'completed' && (
                      <div className="flex items-center justify-center space-x-4 p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">{match.team_name}</p>
                          <p className="text-xl font-bold text-white">{match.home_score}</p>
                        </div>
                        <div className="text-slate-400">-</div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">{match.opponent_team}</p>
                          <p className="text-xl font-bold text-white">{match.away_score}</p>
                        </div>
                      </div>
                    )}

                    {/* Created By */}
                    {match.created_by_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Oluşturan:</span>
                        <Badge variant="secondary" className="text-xs">
                          {match.created_by_name}
                        </Badge>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        Oluşturulma: {new Date(match.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => router.push(`/teams/${match.team_id}/matches/${match.id}`)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setMatchToDelete(match);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMatches.length === 0 && !isLoading && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Maç Bulunamadı</h3>
              <p className="text-slate-400">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Filtrelere uygun maç bulunamadı.' 
                  : 'Henüz hiç maç bulunmuyor.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMatchToDelete(null);
        }}
        onConfirm={handleDeleteMatch}
        title="Maçı Sil"
        description={`"${matchToDelete?.team_name} vs ${matchToDelete?.opponent_team}" maçını kalıcı olarak silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
