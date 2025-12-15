import { prisma } from '../index.js';
import { authService } from './auth.js';

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

interface UpdateUserInput {
  name?: string;
  companyName?: string;
  isActive?: boolean;
}

export const userService = {
  /**
   * Create a new user
   */
  async create(data: CreateUserInput) {
    try {
      const passwordHash = await authService.hashPassword(data.password);

      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          name: data.name,
          companyName: data.companyName,
        },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          isActive: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  async getById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
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
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  },

  /**
   * Get user by email
   */
  async getByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
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
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  },

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserInput) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  /**
   * Change user password
   */
  async changePassword(id: string, newPassword: string) {
    try {
      const passwordHash = await authService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  },

  /**
   * Get all phone numbers for a user
   */
  async getPhoneNumbers(userId: string) {
    try {
      return await prisma.phoneNumber.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      console.error('Get phone numbers error:', error);
      return [];
    }
  },

  /**
   * Add a phone number to a user
   */
  async addPhoneNumber(userId: string, number: string, label?: string) {
    try {
      // Normalize phone number (ensure it starts with +)
      const normalizedNumber = number.startsWith('+') ? number : `+${number}`;

      return await prisma.phoneNumber.create({
        data: {
          number: normalizedNumber,
          label,
          userId,
        },
      });
    } catch (error) {
      console.error('Add phone number error:', error);
      throw error;
    }
  },

  /**
   * Remove a phone number
   */
  async removePhoneNumber(userId: string, phoneNumberId: string) {
    try {
      await prisma.phoneNumber.delete({
        where: {
          id: phoneNumberId,
          userId, // Ensure user owns this number
        },
      });
      return true;
    } catch (error) {
      console.error('Remove phone number error:', error);
      return false;
    }
  },

  /**
   * Get user by phone number (for call routing)
   */
  async getUserByPhoneNumber(phoneNumber: string) {
    try {
      // Normalize phone number for lookup
      const normalizedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      const phone = await prisma.phoneNumber.findUnique({
        where: { number: normalizedNumber },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              companyName: true,
              isActive: true,
            },
          },
        },
      });

      if (!phone || !phone.isActive || !phone.user.isActive) {
        return null;
      }

      return phone.user;
    } catch (error) {
      console.error('Get user by phone number error:', error);
      return null;
    }
  },

  /**
   * List all users (admin function)
   */
  async list(limit: number = 50) {
    try {
      return await prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              phoneNumbers: true,
              calls: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('List users error:', error);
      return [];
    }
  },
};
