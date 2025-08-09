'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ConfirmModal from '@/components/ConfirmModal';
import { 
  Users, 
  Search, 
  Trash2,
  ArrowLeft,
  Shield,
  UserCog,
  Calendar,
  Trophy
} from 'lucide-react';

interface Team {
  id: number;
  name: string;
  description?: string;
  team_size: number;
  created_by: number;
  captain_id?: number;
  authorized_members?: number[];
  created_at: string;
  created_by_name?: string;
  captain_name?: string;
  player_count?: number;
  match_count?: number;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter teams based on search term
    if (searchTerm.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.captain_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
    }
  }, [searchTerm, teams]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
        setFilteredTeams(data.teams);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Teams fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || deleteConfirmName !== teamToDelete.name) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/teams/${teamToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setTeams(teams.filter(t => t.id !== teamToDelete.id));
        setShowDeleteModal(false);
        setTeamToDelete(null);
        setDeleteConfirmName('');
      } else {
        throw new Error('Takım silinemedi');
      }
    } catch (error) {
      console.error('Delete team error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSizeBadge = (size: number) => {
    return <Badge variant="outline">{size}v{size}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Takımlar yükleniyor...</p>
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
              <h1 className="text-xl font-bold text-white">Takım Yönetimi</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Takım ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 w-64"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-slate-300">
                <UserCog className="w-4 h-4 mr-2" />
                Toplam: {teams.length}
              </Badge>
              <Badge variant="outline" className="text-slate-300">
                Gösterilen: {filteredTeams.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {team.description || 'Açıklama yok'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSizeBadge(team.team_size)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Owner */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Takım Sahibi:</span>
                    <Badge variant="secondary" className="text-xs">
                      {team.created_by_name || `ID: ${team.created_by}`}
                    </Badge>
                  </div>

                  {/* Captain */}
                  {team.captain_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Kaptan:</span>
                      <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                        {team.captain_name}
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                      <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Oyuncular</p>
                      <p className="text-white font-semibold">{team.player_count || 0}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                      <Trophy className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Maçlar</p>
                      <p className="text-white font-semibold">{team.match_count || 0}</p>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      Oluşturulma: {new Date(team.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-4 border-t border-slate-700">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setTeamToDelete(team);
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
          ))}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && !isLoading && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="text-center py-12">
              <UserCog className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Takım Bulunamadı</h3>
              <p className="text-slate-400">
                {searchTerm ? 'Arama kriterlerinize uygun takım bulunamadı.' : 'Henüz hiç takım bulunmuyor.'}
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
          setTeamToDelete(null);
          setDeleteConfirmName('');
        }}
        onConfirm={handleDeleteTeam}
        title="Takımı Sil"
        description={`"${teamToDelete?.name}" takımını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilişkili veriler silinecek.`}
        confirmText="Sil"
        confirmVariant="destructive"
        isLoading={isDeleting}
        requireTextConfirmation={true}
        confirmationText={teamToDelete?.name || ''}
        inputValue={deleteConfirmName}
        onInputChange={setDeleteConfirmName}
        inputPlaceholder="Takım adını buraya yazın..."
      />
    </div>
  );
}
