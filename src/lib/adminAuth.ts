import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  isAdmin: boolean;
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    if (decoded.isAdmin && decoded.role === 'admin') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(request: NextRequest): AdminUser | null {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  
  return verifyAdminToken(token);
}

export function requireAdmin(request: NextRequest): AdminUser {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    throw new Error('Admin authentication required');
  }
  return admin;
}
