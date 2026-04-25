import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable is not set. " +
    "Add it to your .env.local file for local dev, or to your Vercel project settings for production."
  );
}

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      dbName: "woodlands",
      serverSelectionTimeoutMS: 5000,
    }).catch((err) => {
      cache.promise = null; // allow retry on next request
      throw err;
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
