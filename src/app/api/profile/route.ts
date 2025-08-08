import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { userDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const user = await userDB.getById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Profil bilgileri yüklenemedi' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, username, positions, availability_status } = body;

    // Validasyon
    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Ad soyad en az 2 karakter olmalıdır' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi giriniz' }, { status: 400 });
    }

    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: 'Kullanıcı adı en az 3 karakter olmalıdır' }, { status: 400 });
    }

    // E-posta benzersizlik kontrolü (kendi e-postası hariç)
    const existingUserByEmail = await userDB.getByEmail(email);
    if (existingUserByEmail && existingUserByEmail.id !== decoded.id) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanılıyor' }, { status: 400 });
    }

    // Kullanıcı adı benzersizlik kontrolü (kendi kullanıcı adı hariç)
    const existingUserByUsername = await userDB.getByUsername(username);
    if (existingUserByUsername && existingUserByUsername.id !== decoded.id) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 400 });
    }

    // Pozisyon sayısı kontrolü
    if (positions && positions.length > 3) {
      return NextResponse.json({ error: 'En fazla 3 pozisyon seçebilirsiniz' }, { status: 400 });
    }

    // Kullanıcıyı güncelle
    const updatedUser = await userDB.update(decoded.id, {
      full_name: full_name.trim(),
      email: email.trim(),
      username: username.trim(),
      positions: positions || [],
      availability_status: availability_status || 'available'
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Profil güncellenemedi' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profil başarıyla güncellendi',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Profil güncellenemedi' }, { status: 500 });
  }
} 