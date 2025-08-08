'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Giriş başarısız');
      }
    } catch {
      setError('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo ve Başlık */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">⚽</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Halısaha Takım Yöneticisi
          </h2>
        </div>

        {/* Login Form */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-xl border border-border p-8">
          <div className="space-y-1 pb-6">
            <h3 className="text-2xl font-semibold text-center text-foreground">
              Giriş Yap
            </h3>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Badge variant="destructive" className="w-full justify-center">
                {error}
              </Badge>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                E-posta veya Kullanıcı Adı
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                placeholder="ornek@email.com veya kullaniciadi"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                placeholder="Şifrenizi girin"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Badge variant="outline" className="text-sm">
              Hesabınız yok mu? <a href="/auth/register" className="text-primary hover:underline font-medium">Kayıt olun</a>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 