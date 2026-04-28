import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body;

  if (
    [username, fullname, email, password].some(
      (value) => !value || value?.trim() === ""
    )
  ) {
    throw new apiError("all fields are required", 400);
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new apiError("user already exists", 409);
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError("avatar image is required", 400);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new apiError("avatar image is required", 400);
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError("something went wrong while creating user", 500);
  }

  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "user created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new apiError("username or email is required", 400);
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!existedUser) {
    throw new apiError("user does not exist", 404);
  }

  const isPasswordCorrect = await existedUser.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new apiError("password is incorrect", 404);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existedUser._id
  );

  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError("unauthorized request", 401);
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError("Invalid refresh token", 401);
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError("refresh token expired", 401);
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          "200",
          {
            accessToken,
            refreshToken,
          },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(
      error?.message || "something went wrong while refreshing access token",
      401
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const currentPassword = await user.isPasswordCorrect(oldPassword);

  if (!currentPassword) {
    throw new apiError("password is incorrect", 400);
  }

  user.password = newPassword;

  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "password changed successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new apiError("unauthorized request", 401);
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "user fetched successfully"));
});

const updateUserInfo = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname && !email) {
    return new apiError("all fields are required", 401);
  }

  const updatedUser = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        ...(fullname && { fullname }),
        ...(email && { email }),
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "user details changed successfully")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUser,
  changePassword,
  updateUserInfo,
};
