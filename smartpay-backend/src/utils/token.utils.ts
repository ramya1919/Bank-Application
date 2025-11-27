// src/utils/token.utils.ts
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET: Secret = (process.env.JWT_SECRET || '') as Secret;
const REFRESH_SECRET: Secret = (process.env.JWT_REFRESH_SECRET || '') as Secret;

const accessTokenOptions: SignOptions = {
  // cast to any to satisfy types for jsonwebtoken v9 typings
  expiresIn: (process.env.JWT_EXPIRY as any) || '15m',
  algorithm: 'HS256'
};

const refreshTokenOptions: SignOptions = {
  expiresIn: (process.env.JWT_REFRESH_EXPIRY as any) || '7d',
  algorithm: 'HS256'
};

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, ACCESS_SECRET, accessTokenOptions);
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, REFRESH_SECRET);
}
