import mongoose from "mongoose";

export const connectDB = async (mongoUri: string) => {
  try {
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

