import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartpay';
  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log('✅ MongoDB connected');
}
