import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userDB } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: number; username: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string };
  } catch {
    return null;
  }
}

export async function createUser(username: string, email: string, password: string, fullName: string): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(password);
    
    // Kullanıcı adı zaten var mı kontrol et
    const existingUserByUsername = await userDB.getByUsername(username);
    if (existingUserByUsername) {
      return null;
    }
    
    // Email zaten var mı kontrol et
    const existingUserByEmail = await userDB.getByEmail(email);
    if (existingUserByEmail) {
      return null;
    }
    
    const newUser = await userDB.create({
      username,
      email,
      password_hash: hashedPassword,
      full_name: fullName
    });
    
    if (newUser) {
      return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        created_at: newUser.created_at
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const user = await userDB.getByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const user = await userDB.getById(id);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
} 