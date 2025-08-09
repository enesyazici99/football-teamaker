# Database Migration Guide

Bu rehber, Football Teamaker uygulamasının database migration'larını nasıl çalıştıracağınızı açıklar.

## Migration Endpoint'leri

### 1. Migration Durumunu Kontrol Et
```
GET /api/migrate
```

**Örnek Kullanım:**
```bash
curl -X GET https://your-domain.com/api/migrate
```

**Yanıt Örneği:**
```json
{
  "message": "Migration endpoint hazır",
  "instructions": [
    "Migration çalıştırmak için POST isteği gönderin",
    "URL: /api/migrate",
    "Method: POST"
  ],
  "status": "needs_migration",
  "constraintStatus": [
    {
      "table": "players",
      "column": "user_id",
      "target": "users.id",
      "deleteRule": "NO ACTION",
      "needsUpdate": true
    }
  ],
  "needsUpdate": true
}
```

### 2. Migration'ı Çalıştır
```
POST /api/migrate
```

**Örnek Kullanım:**
```bash
curl -X POST https://your-domain.com/api/migrate
```

**Yanıt Örneği:**
```json
{
  "message": "Veritabanı migration başarıyla tamamlandı",
  "status": "success",
  "constraintStatus": [
    {
      "source_table": "players",
      "source_column": "user_id",
      "target_table": "users",
      "target_column": "id",
      "constraint_name": "players_user_id_fkey",
      "delete_rule": "CASCADE",
      "update_rule": "NO ACTION"
    }
  ],
  "migrations": [
    "✅ Database initialization (missing columns)",
    "✅ Foreign key constraints optimization",
    "✅ User deletion CASCADE setup"
  ]
}
```

## Migration İçeriği

Bu migration aşağıdaki değişiklikleri yapar:

### 1. Database Initialization
- Eksik sütunları ekler
- Temel tablo yapılarını oluşturur

### 2. Foreign Key Constraint Optimization
Aşağıdaki constraint'leri `NO ACTION`'dan `CASCADE`'e çevirir:

| Tablo | Sütun | Hedef | Eski Kural | Yeni Kural |
|-------|-------|-------|-------------|------------|
| `players` | `user_id` | `users.id` | NO ACTION | **CASCADE** |
| `match_players` | `player_id` | `players.id` | NO ACTION | **CASCADE** |
| `match_players` | `match_id` | `matches.id` | NO ACTION | **CASCADE** |

### 3. User Deletion Optimization
CASCADE ayarları sayesinde user silindiğinde:
- ✅ `players` kayıtları otomatik silinir
- ✅ `player_ratings` kayıtları otomatik silinir  
- ✅ `match_players` kayıtları otomatik silinir
- ✅ `team_positions` kayıtları otomatik silinir
- ✅ `notifications` kayıtları otomatik silinir

## Kullanım Örnekleri

### Tarayıcıdan Test
1. **Durum Kontrolü:** `https://your-domain.com/api/migrate` GET isteği
2. **Migration Çalıştır:** `https://your-domain.com/api/migrate` POST isteği

### Postman/Thunder Client
```http
### Migration Durumu
GET https://your-domain.com/api/migrate

### Migration Çalıştır  
POST https://your-domain.com/api/migrate
```

### cURL ile
```bash
# Durum kontrolü
curl -X GET https://your-domain.com/api/migrate

# Migration çalıştır
curl -X POST https://your-domain.com/api/migrate \
  -H "Content-Type: application/json"
```

## Güvenlik Notları

⚠️ **ÖNEMLİ**: Migration endpoint'i production'da admin yetkisi gerektirecek şekilde korunmalıdır.

### Önerilen Koruma (İsteğe Bağlı)
```typescript
// Migration endpoint'ine admin auth eklemek için:
import { adminAuth } from '@/lib/adminAuth';

export async function POST(request: Request) {
  // Admin kontrolü ekle
  const adminUser = await adminAuth(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Migration kodları...
}
```

## Sık Karşılaşılan Sorunlar

### 1. Migration Zaten Çalıştırılmış
```json
{
  "status": "up_to_date",
  "needsUpdate": false
}
```
**Çözüm:** Migration zaten yapılmış, tekrar çalıştırmaya gerek yok.

### 2. Database Connection Hatası
```json
{
  "error": "Migration hatası",
  "details": "Connection failed"
}
```
**Çözüm:** `DATABASE_URL` environment variable'ını kontrol edin.

### 3. Permission Hatası
```json
{
  "error": "Migration hatası", 
  "details": "permission denied"
}
```
**Çözüm:** Database user'ının ALTER TABLE yetkisi olduğunu kontrol edin.

## Rollback

Migration otomatik rollback yapılmaz. Eğer bir sorun çıkarsa manuel olarak geri alınması gerekir:

```sql
-- Constraint'leri eski haline getirmek için:
ALTER TABLE players DROP CONSTRAINT players_user_id_fkey;
ALTER TABLE players ADD CONSTRAINT players_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION;
```

---
*Bu migration Football Teamaker v1.0+ için hazırlanmıştır.*
