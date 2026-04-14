import { User } from "../models/user.models.js";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError("unauthorized request", 401);
    }

    const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new apiError("Invalid access token", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new apiError(error?.message, 401);
  }
});
