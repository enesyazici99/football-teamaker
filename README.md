# ⚽ Halısaha Takım Yöneticisi

Halısaha ekibiniz için oyuncu mevkilendirme ve saha dizilimi yapan modern web uygulaması.

## 🚀 Özellikler

- 👥 Oyuncu yönetimi ve pozisyon belirleme
- ⚽ Maç planlaması ve organizasyonu
- 🎯 Otomatik mevkilendirme sistemi
- 📊 Performans takibi ve istatistikler
- 🔐 Güvenli kullanıcı authentication
- 📱 Responsive tasarım

## 🛠️ Teknolojiler

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Neon PostgreSQL
- **Authentication:** JWT, bcryptjs
- **Deployment:** Vercel

## 📋 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/football-teamaker.git
cd football-teamaker
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install --legacy-peer-deps
```

### 3. Neon PostgreSQL Veritabanı Kurulumu

1. [Neon](https://neon.tech) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Connection string'i kopyalayın
4. `.env.local` dosyası oluşturun:

```bash
# .env.local dosyası oluşturun
touch .env.local
```

5. `.env.local` dosyasına aşağıdaki içeriği ekleyin:

```env
# Neon PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret Key (production'da değiştirin)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 4. Veritabanını Başlatın

Uygulama ilk çalıştırıldığında otomatik olarak gerekli tablolar oluşturulacaktır.

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 🗄️ Veritabanı Şeması

### Users Tablosu
- `id`: Primary key
- `username`: Kullanıcı adı (unique)
- `email`: Email adresi (unique)
- `password_hash`: Şifrelenmiş şifre
- `full_name`: Tam ad
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

### Teams Tablosu
- `id`: Primary key
- `name`: Takım adı
- `description`: Takım açıklaması
- `created_by`: Oluşturan kullanıcı ID
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

### Players Tablosu
- `id`: Primary key
- `user_id`: Kullanıcı ID (foreign key)
- `team_id`: Takım ID (foreign key)
- `position`: Oyuncu pozisyonu
- `skill_level`: Beceri seviyesi (1-10)
- `is_active`: Aktif durumu
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

### Matches Tablosu
- `id`: Primary key
- `team_id`: Takım ID (foreign key)
- `match_date`: Maç tarihi
- `location`: Maç yeri
- `status`: Maç durumu
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

### Match_Players Tablosu
- `id`: Primary key
- `match_id`: Maç ID (foreign key)
- `player_id`: Oyuncu ID (foreign key)
- `team_side`: Takım tarafı (A/B)
- `position`: Maçtaki pozisyon
- `created_at`: Oluşturulma tarihi

## 🚀 Deployment (Vercel)

### 1. Vercel Hesabı Oluşturun

1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub hesabınızı bağlayın

### 2. Projeyi Deploy Edin

1. Vercel Dashboard'a gidin
2. "New Project" butonuna tıklayın
3. GitHub repository'nizi seçin
4. Proje ayarlarını yapılandırın:

#### Environment Variables

Aşağıdaki environment variable'ları Vercel'de ayarlayın:

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Deploy

1. "Deploy" butonuna tıklayın
2. Deployment tamamlanana kadar bekleyin
3. Uygulamanız canlıda çalışmaya başlayacak

### 4. Custom Domain (Opsiyonel)

1. Vercel Dashboard'da projenizi seçin
2. "Settings" > "Domains" bölümüne gidin
3. Custom domain'inizi ekleyin

## 📝 Kullanım

1. **Kayıt Olun:** İlk kullanımda hesap oluşturun
2. **Giriş Yapın:** Oluşturduğunuz hesapla giriş yapın
3. **Takım Oluşturun:** İlk takımınızı oluşturun
4. **Oyuncu Ekleyin:** Takımınıza oyuncular ekleyin
5. **Maç Planlayın:** Yeni maçlar planlayın
6. **Mevkilendirme Yapın:** Otomatik veya manuel mevkilendirme yapın

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Herhangi bir sorun yaşarsanız:
1. GitHub Issues'da sorun bildirin
2. Email ile iletişime geçin: support@football-teamaker.com

## 🔄 Güncellemeler

- **v0.1.0:** İlk sürüm - Temel authentication ve kullanıcı yönetimi
- Gelecek sürümlerde: Otomatik mevkilendirme, istatistikler, mobil uygulama
