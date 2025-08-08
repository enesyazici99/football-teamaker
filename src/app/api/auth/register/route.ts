import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, fullName } = registerSchema.parse(body);

    const user = await createUser(username, email, password, fullName);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulamadı. Kullanıcı adı veya email zaten kullanımda olabilir.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Kullanıcı başarıyla oluşturuldu', user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 