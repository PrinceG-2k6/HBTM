import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hbtm";

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to ${mongoURI}`);
  } catch (error: any) {
    console.warn(`[MongoDB Warning] Database connection failed (${error.message}). Operating in high-speed Memory Mode.`);
  }
};
