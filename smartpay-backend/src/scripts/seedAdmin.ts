// src/scripts/seedAdmin.ts
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model';

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartpay';
  await mongoose.connect(uri);
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@smartpay.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS || 12));
  const accountNumber = `ACADM${Date.now().toString().slice(-8)}`;
  const admin = await User.create({
    fullName: 'SmartPay Admin',
    email,
    password: hashed,
    role: 'admin',
    accountNumber,
    walletBalance: 1000000
  });
  console.log('Admin seeded:', admin.email, 'password:', password);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
