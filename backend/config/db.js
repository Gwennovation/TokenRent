/**
 * MongoDB connection — designed to be safe for serverless cold starts.
 * Caches the connection promise across function invocations.
 */
const mongoose = require('mongoose');

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGO_URI) {
    console.error(' MONGO_URI is missing from environment — set it before starting the server.');
    if (process.env.NODE_ENV !== 'production') process.exit(1);
    throw new Error('MONGO_URI missing');
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    }).then(m => {
      console.log(`  MongoDB connected: ${m.connection.host}/${m.connection.name}`);
      return m;
    }).catch(err => {
      cached.promise = null;
      console.error(' MongoDB connection error:', err.message);
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
