// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, phone } = req.body;
    const result = await authService.registerUser({ fullName, email, password, phone });
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE
    });
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrPhone, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const result = await authService.loginUser({ emailOrPhone, password, ip, userAgent: String(userAgent) });
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE
    });
    res.json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const result = await authService.refreshAccessToken(refreshToken, ip, String(userAgent));
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE
    });
    res.json({ accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
