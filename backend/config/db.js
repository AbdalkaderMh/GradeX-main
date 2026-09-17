import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 5,
    });
  }

  try {
    await connectionPromise;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    connectionPromise = null;
    console.error("❌ Database connection failed:");
    console.error(error.message);
    throw error;
  }
};

export default connectDB;