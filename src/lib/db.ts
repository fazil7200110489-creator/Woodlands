import mongoose from "mongoose";

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

function getMongoURI(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MONGODB_URI environment variable is not set. " +
      "Add it to your Vercel project settings → Environment Variables."
    );
  }
  return "mongodb://127.0.0.1:27017/woodlands";
}

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const uri = getMongoURI();
    cache.promise = mongoose.connect(uri, {
      dbName: "woodlands",
      serverSelectionTimeoutMS: 5000,
    }).catch((err) => {
      cache.promise = null;
      throw err;
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

