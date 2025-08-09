import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin credentials (hardcoded as requested)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'aenes1999'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate credentials
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // Create admin token
    const adminToken = jwt.sign(
      { 
        id: 'admin',
        username: 'admin',
        role: 'admin',
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    const response = NextResponse.json({ 
      message: 'Admin girişi başarılı',
      user: {
        id: 'admin',
        username: 'admin',
        role: 'admin'
      }
    });

    response.cookies.set('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Admin çıkışı başarılı' });
    
    // Clear admin token cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
