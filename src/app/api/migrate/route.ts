import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function POST() {
  try {
    console.log('Starting database migration...');
    
    // Veritabanını başlat (eksik sütunları eklemek için)
    await initializeDatabase();
    
    console.log('Database migration completed successfully');
    
    return NextResponse.json({ 
      message: 'Veritabanı migration başarıyla tamamlandı',
      timestamp: new Date().toISOString(),
      status: 'success'
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration hatası', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('Checking database migration status...');
    
    // Sadece migration durumunu kontrol et, çalıştırma
    return NextResponse.json({ 
      message: 'Migration endpoint hazır',
      instructions: 'Migration çalıştırmak için POST isteği gönderin',
      timestamp: new Date().toISOString(),
      status: 'ready'
    });
    
  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json(
      { 
        error: 'Migration durumu kontrol edilemedi', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
} 