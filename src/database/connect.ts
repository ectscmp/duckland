import mongoose from "mongoose";

export default async function attemptDatabaseConnection(): Promise<void> {
  const URI: string | null = process.env.MONGO_CONNECTION_URI || null;
  if (!URI) return;
  try {
    await mongoose.connect(URI);
    console.log("Database connection succeeded!");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
