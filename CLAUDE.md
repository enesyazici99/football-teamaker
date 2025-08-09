# CLAUDE.md - Proje Geliştirme Notları

## Vercel Deployment Kuralları

### Önemli Notlar
- Localde sorunsuz çalışan kod Vercel'de hata verebilir
- Vercel build sırasında ESLint kuralları daha katı uygulanır
- Build hatalarını önlemek için aşağıdaki kurallara dikkat edilmeli

### ESLint Kuralları

1. **Kullanılmayan değişkenler (@typescript-eslint/no-unused-vars)**
   - Kullanılmayan değişkenler `_` ile başlamalı
   - Örnek: `const [_unusedVar, setUnusedVar] = useState()`

2. **React Hook bağımlılıkları (react-hooks/exhaustive-deps)**
   - useEffect, useCallback gibi hook'ların bağımlılık dizileri eksik olmamalı
   - Eğer bağımlılık eklenmeyecekse `// eslint-disable-next-line react-hooks/exhaustive-deps` yorumu eklenmeli
   - Fonksiyonel güncellemeler kullanılarak bağımlılık ihtiyacı azaltılabilir:
     ```typescript
     setPositions(prevPositions => {
       // prevPositions kullanarak güncelleme
     });
     ```

3. **Build Komutları**
   - Vercel deployment öncesi local'de `npm run build` ile test edilmeli
   - Tüm TypeScript ve ESLint hataları düzeltilmeli

### Yaygın Hatalar ve Çözümleri

1. **Sonsuz döngü problemi**
   - useCallback bağımlılıklarına dikkat et
   - State değişkenlerini bağımlılık listesine ekleme (sonsuz döngüye neden olur)
   
2. **Kullanılmayan import'lar**
   - Tüm kullanılmayan import'ları kaldır
   - Kullanılmayan state değişkenlerini `_` prefix'i ile işaretle

## Proje Özellikleri

### Takım Davet Sistemi
- Aynı takımdan aynı kullanıcıya birden fazla bekleyen davet gönderilemez
- Kullanıcılar kendilerine davet gönderemez
- Davet durumu kontrolü: `status === 'pending'`

### Formasyon Sayfası
- Formasyon değişikliği sırasında mevcut oyuncu atamaları korunur
- API çağrıları optimize edilmiş (sonsuz döngü önlendi)
- Yetki kontrolü: Sadece takım sahibi ve kaptan formasyon değiştirebilir

## Test Komutları
```bash
# Build testi (deployment öncesi mutlaka çalıştır)
npm run build

# Lint kontrolü
npm run lint

# TypeScript tip kontrolü
npm run typecheck
```