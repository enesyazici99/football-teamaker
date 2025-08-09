import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { userDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    requireAdmin(request);

    // Get all users
    const users = await userDB.getAll();

    // Clean up user data, no mock data
    const cleanUsers = users.map(user => ({
      ...user,
      positions: user.positions || [],
      availability_status: user.availability_status || 'available'
    }));

    return NextResponse.json({ users: cleanUsers });

  } catch (error) {
    console.error('Admin users fetch error:', error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
