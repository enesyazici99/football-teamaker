import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { userDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, fullName } = body;

    // Validasyon
    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: 'Kullanıcı adı en az 3 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi giriniz' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: 'Ad soyad en az 2 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Kullanıcı adı benzersizlik kontrolü
    const existingUserByUsername = await userDB.getByUsername(username);
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Email benzersizlik kontrolü
    const existingUserByEmail = await userDB.getByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    const user = await createUser(username, email, password, fullName);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Kullanıcı başarıyla oluşturuldu', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 