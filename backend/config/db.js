import mongoose from "mongoose";

const connectDB = async () => {
  // Reuse existing connection if already connected or connecting
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (mongoose.connection.readyState === 2) {
    // connecting already, wait for it
    await new Promise((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);

    // Do NOT process.exit in serverless — just rethrow so the caller can handle it
    throw error;
  }
};

export default connectDB;