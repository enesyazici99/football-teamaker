# Football Team Maker - Kurulum Rehberi

## Environment Variables

Bu projeyi çalıştırmak için aşağıdaki environment variable'ları ayarlamanız gerekiyor:

### 1. .env.local Dosyası Oluşturun

Proje ana dizininde `.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Database Configuration
DATABASE_URL=your_neon_database_url_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Database URL

Neon Database kullanıyorsanız:
1. [Neon Console](https://console.neon.tech/) adresine gidin
2. Yeni bir proje oluşturun
3. Connection string'i kopyalayın
4. `DATABASE_URL` değişkenine yapıştırın

Örnek format:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### 3. JWT Secret

Güvenli bir JWT secret key oluşturun:
```bash
# Terminal'de çalıştırın
openssl rand -base64 32
```

Bu komutun çıktısını `JWT_SECRET` değişkenine atayın.

### 4. NextAuth Secret

NextAuth için güvenli bir secret oluşturun:
```bash
# Terminal'de çalıştırın
openssl rand -base64 32
```

Bu komutun çıktısını `NEXTAUTH_SECRET` değişkenine atayın.

## Kurulum Adımları

1. **Environment variables'ları ayarlayın** (yukarıdaki adımları takip edin)

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Development server'ı başlatın:**
   ```bash
   npm run dev
   ```

4. **Tarayıcıda açın:**
   ```
   http://localhost:3000
   ```

## Sorun Giderme

### Database Connection Hatası
Eğer "No database connection string was provided" hatası alıyorsanız:
1. `.env.local` dosyasının doğru konumda olduğundan emin olun
2. `DATABASE_URL` değişkeninin doğru formatta olduğunu kontrol edin
3. Neon Database bağlantınızın aktif olduğunu kontrol edin

### 401 Unauthorized Hatası
Eğer API endpoint'lerinde 401 hatası alıyorsanız:
1. Kullanıcı girişi yaptığınızdan emin olun
2. Browser'da cookie'lerin aktif olduğunu kontrol edin
3. JWT_SECRET değişkeninin doğru ayarlandığını kontrol edin

## Notlar

- Bu proje Neon Database kullanmaktadır
- JWT token'lar cookie'de saklanmaktadır
- Tüm API endpoint'leri hem Authorization header hem de cookie'den token kontrolü yapar 