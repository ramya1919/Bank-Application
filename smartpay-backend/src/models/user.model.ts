// src/models/user.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: 'user' | 'admin';
  accountNumber: string;
  walletBalance: number;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  accountNumber: { type: String, unique: true, index: true, required: true },
  walletBalance: { type: Number, default: 0 },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
