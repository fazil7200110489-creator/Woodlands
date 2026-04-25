import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error(
          "MONGODB_URI environment variable is not set. " +
          "Add it to your Vercel project settings → Environment Variables."
        );
      })()
    : "mongodb://127.0.0.1:27017/woodlands") as string;

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
