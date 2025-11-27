// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/user.model';
import RefreshToken from '../models/refreshToken.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.utils';

/**
 * Parse expiry string like "7d", "15m", "3600s" into milliseconds
 */
function parseExpiryToMs(exp?: string): number {
  if (!exp) return 0;
  const r = /^(\d+)([smhd])?$/;
  const m = exp.match(r);

  if (!m) {
    const n = Number(exp);
    return Number.isNaN(n) ? 0 : n * 60 * 1000;
  }

  const n = Number(m[1]);
  const unit = m[2] || 'm';

  switch (unit) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default:  return n * 60 * 1000;
  }
}

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 12);
const REFRESH_EXP_MS = parseExpiryToMs(process.env.JWT_REFRESH_EXPIRY);

/**
 * Generate account number
 */
function genAccountNumber(): string {
  return `AC${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
}

/**
 * Register user - FIXED VERSION
 */
export async function registerUser(data: { fullName: string; email: string; password: string; phone?: string; }) {
  const { fullName, email, password, phone } = data;

  console.log("Incoming body:", data);

  // Build only valid OR conditions
  const orConditions: any[] = [];
  if (email && email.trim() !== "") orConditions.push({ email });
  if (phone && phone.trim() !== "") orConditions.push({ phone });

  // If both were empty → invalid request
  if (orConditions.length === 0) {
    const err: any = new Error("Email or phone is required");
    err.status = 400;
    throw err;
  }

  // Check unique user on actual fields
  const existing = await User.findOne({ $or: orConditions });
  if (existing) {
    const err: any = new Error('User already exists');
    err.status = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const accountNumber = genAccountNumber();

  const user = await User.create({
    fullName,
    email,
    phone,
    password: hashed,
    accountNumber,
    walletBalance: 0
  });

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  const expiresAt = new Date(Date.now() + (REFRESH_EXP_MS || 7 * 24 * 60 * 60 * 1000));

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt
  });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      accountNumber: user.accountNumber
    },
    accessToken,
    refreshToken
  };
}

/**
 * Login user
 */
export async function loginUser(data: { emailOrPhone: string; password: string; ip?: string; userAgent?: string }) {
  const { emailOrPhone, password, ip, userAgent } = data;

  const user = await User.findOne({
    $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
  });

  if (!user) {
    const err: any = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err: any = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  const expiresAt = new Date(Date.now() + (REFRESH_EXP_MS || 7 * 24 * 60 * 60 * 1000));

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    ip,
    userAgent,
    expiresAt
  });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      accountNumber: user.accountNumber
    },
    accessToken,
    refreshToken
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken?: string, ip?: string, userAgent?: string) {
  if (!refreshToken) {
    const err: any = new Error('No refresh token provided');
    err.status = 400;
    throw err;
  }

  let payload: any;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    const err: any = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const stored = await RefreshToken.findOne({
    token: refreshToken,
    user: payload.id,
    revoked: false
  });

  if (!stored) {
    const err: any = new Error('Refresh token not found or revoked');
    err.status = 401;
    throw err;
  }

  stored.revoked = true;
  await stored.save();

  const newRefresh = signRefreshToken({ id: payload.id });
  const expiresAt = new Date(Date.now() + (REFRESH_EXP_MS || 7 * 24 * 60 * 60 * 1000));

  await RefreshToken.create({
    user: payload.id,
    token: newRefresh,
    ip,
    userAgent,
    expiresAt
  });

  const accessToken = signAccessToken({ id: payload.id });

  return { accessToken, refreshToken: newRefresh };
}

/**
 * Logout (revoke refresh)
 */
export async function logout(refreshToken?: string) {
  if (!refreshToken) return;
  await RefreshToken.findOneAndUpdate(
    { token: refreshToken },
    { revoked: true }
  );
}
