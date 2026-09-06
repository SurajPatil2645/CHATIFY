import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
    try{
        await mongoose.connect(ENV.MONGO_URL);
        console.log(`MongoDB Database Connected`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};