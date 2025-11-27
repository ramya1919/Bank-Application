// src/models/refreshToken.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

const RefreshTokenSchema: Schema<IRefreshToken> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  userAgent: String,
  ip: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false }
});

// TTL optional; expiry date document will be removed after expiresAt
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
