import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">⚽</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Halısaha Takım Yöneticisi
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/auth/login">
                <button className="bg-card border border-border text-foreground font-semibold py-2 px-4 rounded-lg hover:bg-muted transition-colors duration-200">
                  Giriş Yap
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200">
                  Kayıt Ol
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Halısaha Ekibinizi{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Profesyonelce
            </span>{' '}
            Yönetin
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Her hafta düzenli maçlarınızda oyuncu mevkilendirmelerini yapın, 
            saha dizilimlerini ayarlayın ve takım performansınızı takip edin.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Oyuncu Yönetimi
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Oyuncularınızı ekleyin, pozisyonlarını belirleyin ve 
              beceri seviyelerini takip edin.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚽</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Maç Planlaması
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Haftalık maçlarınızı planlayın, oyuncu listelerini 
              oluşturun ve saha dizilimlerini ayarlayın.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Performans Takibi
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Maç sonuçlarınızı kaydedin, oyuncu performanslarını 
              analiz edin ve istatistiklerinizi görüntüleyin.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm rounded-xl shadow-xl border border-border p-8">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Hemen Başlayın
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-all duration-200">
                  Ücretsiz Kayıt Ol
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="bg-card border border-border text-foreground font-semibold text-lg px-8 py-3 rounded-lg hover:bg-muted transition-colors duration-200">
                  Giriş Yap
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              © 2025 Halısaha Takım Yöneticisi. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
