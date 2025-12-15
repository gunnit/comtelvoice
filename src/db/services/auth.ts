import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

interface TokenPayload {
  userId: string;
  email: string;
}

interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    companyName: string | null;
  };
  token: string;
}

export const authService = {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate a JWT token
   */
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
  },

  /**
   * Verify a JWT token and return the payload
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResult | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.isActive) {
        return null;
      }

      const isValid = await this.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      const token = this.generateToken({ userId: user.id, email: user.email });

      // Parse JWT expiration for session storage
      const decoded = jwt.decode(token) as { exp: number } | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create session in database
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  /**
   * Validate a session token exists and is not expired
   */
  async validateSession(token: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
      });

      if (!session) {
        return false;
      }

      // Check if expired
      if (session.expiresAt < new Date()) {
        // Delete expired session
        await prisma.session.delete({ where: { token } });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },

  /**
   * Logout by deleting the session
   */
  async logout(token: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { token },
      });
    } catch (error) {
      // Session might not exist, that's ok
    }
  },

  /**
   * Get user by ID (without password hash)
   */
  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          isActive: true,
          createdAt: true,
          phoneNumbers: {
            select: {
              id: true,
              number: true,
              label: true,
              isActive: true,
            },
          },
        },
      });
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  /**
   * Clean up expired sessions (call periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      return result.count;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  },
};
