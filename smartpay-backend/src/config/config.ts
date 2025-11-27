import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,

  mongoURI: process.env.MONGO_URI as string,

  jwt: {
    accessSecret: process.env.JWT_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    accessExpiry: process.env.JWT_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },

  security: {
    saltRounds: Number(process.env.SALT_ROUNDS) || 10,
  },

  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:4200",
  },
};
