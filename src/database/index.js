import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";

const connectDatabase = async () => {
  try {
    const connectionINSTANCE = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DATABASE_NAME}`
    );
    console.log(
      "mongodb database connected!!",
      connectionINSTANCE.connection.host
    );
  } catch (error) {
    console.log("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDatabase;
