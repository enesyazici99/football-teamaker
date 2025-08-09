'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Mail,
  Calendar
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
  positions?: string[];
  availability_status?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleDeleteUser = async () => {
    if (!userToDelete || deleteConfirmName !== userToDelete.username) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeleteConfirmName('');
      } else {
        throw new Error('Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Delete user error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_active === false) {
      return <Badge variant="destructive">Pasif</Badge>;
    }
    return <Badge className="bg-green-600 hover:bg-green-700">Aktif</Badge>;
  };

  const getAvailabilityBadge = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-600 hover:bg-green-700">Müsait</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">Müsait Değil</Badge>;
      case 'maybe':
        return <Badge variant="outline">Belki</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Kullanıcılar yükleniyor...</p>
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
              <h1 className="text-xl font-bold text-white">Kullanıcı Yönetimi</h1>
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
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 w-64"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-slate-300">
                <Users className="w-4 h-4 mr-2" />
                Toplam: {users.length}
              </Badge>
              <Badge variant="outline" className="text-slate-300">
                Gösterilen: {filteredUsers.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{user.full_name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      @{user.username}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(user)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{user.email}</span>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  {/* Availability */}
                  {user.availability_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Uygunluk:</span>
                      {getAvailabilityBadge(user.availability_status)}
                    </div>
                  )}

                  {/* Positions */}
                  {user.positions && user.positions.length > 0 && (
                    <div>
                      <span className="text-sm text-slate-400 block mb-2">Mevkiler:</span>
                      <div className="flex flex-wrap gap-1">
                        {user.positions.map((position, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {position}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end pt-4 border-t border-slate-700">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setUserToDelete(user);
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
        {filteredUsers.length === 0 && !isLoading && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Kullanıcı Bulunamadı</h3>
              <p className="text-slate-400">
                {searchTerm ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.' : 'Henüz hiç kullanıcı bulunmuyor.'}
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
          setUserToDelete(null);
          setDeleteConfirmName('');
        }}
        onConfirm={handleDeleteUser}
        title="Kullanıcıyı Sil"
        description={`"${userToDelete?.full_name}" kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        confirmVariant="destructive"
        isLoading={isDeleting}
        requireTextConfirmation={true}
        confirmationText={userToDelete?.username || ''}
        inputValue={deleteConfirmName}
        onInputChange={setDeleteConfirmName}
        inputPlaceholder="Kullanıcı adını buraya yazın..."
      />
    </div>
  );
}
