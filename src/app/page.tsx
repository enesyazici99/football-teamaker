import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                ⚽ Halısaha Takım Yöneticisi
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Giriş Yap</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Kayıt Ol</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Halısaha Ekibinizi Yönetin
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Her hafta düzenli maçlarınızda oyuncu mevkilendirmelerini yapın, 
            saha dizilimlerini ayarlayın ve takım performansınızı takip edin.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">👥</span>
                Oyuncu Yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Oyuncularınızı ekleyin, pozisyonlarını belirleyin ve 
                beceri seviyelerini takip edin.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">⚽</span>
                Maç Planlaması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Haftalık maçlarınızı planlayın, oyuncu listelerini 
                oluşturun ve saha dizilimlerini ayarlayın.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Performans Takibi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Maç sonuçlarınızı kaydedin, oyuncu performanslarını 
                analiz edin ve istatistiklerinizi görüntüleyin.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Hemen Başlayın</CardTitle>
              <CardDescription>
                Ücretsiz hesap oluşturun ve halısaha ekibinizi yönetmeye başlayın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Ücretsiz Kayıt Ol
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Halısaha Takım Yöneticisi. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
