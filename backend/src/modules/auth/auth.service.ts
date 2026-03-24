import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: passwordHash,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken(user.id, user.email);
  return { user, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Constant-time comparison to prevent user enumeration
  const dummyHash = '$2a$12$invalidhashpadding000000000000000000000000000000000000000';
  const hash = user?.password ?? dummyHash;
  const valid = await bcrypt.compare(input.password, hash);

  if (!user || !valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken(user.id, user.email);
  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token,
  };
}

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
