import { Router } from "express";
import {
  changePassword,
  getUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserInfo,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/get-user").get(verifyJWT, getUser);

router.route("/change-password").post(verifyJWT, changePassword);

router.route("/update-user").post(verifyJWT, updateUserInfo);
export default router;
