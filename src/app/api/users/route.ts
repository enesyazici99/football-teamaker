import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { userDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Token kontrolü
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // Tüm kullanıcıları getir (şifre hash'i hariç)
    const users = await userDB.getAll();
    
    // Hassas bilgileri filtrele
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      positions: user.positions || [],
      availability_status: user.availability_status || 'available',
      created_at: user.created_at
    }));

    return NextResponse.json({ users: safeUsers });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 