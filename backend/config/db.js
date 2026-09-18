import mongoose from "mongoose";

let connectionPromise = null;

const attemptConnect = async () => {
  return mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    connectTimeoutMS: 8000,
    maxPoolSize: 5,
  });
};

const connectDB = async (retries = 2) => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    try {
      await connectionPromise;
      return;
    } catch {
      connectionPromise = null;
    }
  }

  connectionPromise = attemptConnect();

  try {
    await connectionPromise;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    connectionPromise = null;
    console.error("❌ Database connection failed:", error.message);

    if (retries > 0) {
      console.log(`🔁 Retrying connection... (${retries} left)`);
      return connectDB(retries - 1);
    }
    throw error;
  }
};

export default connectDB;