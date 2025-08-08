import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Çıkış başarılı' },
      { status: 200 }
    );

    // Token cookie'sini temizle
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 