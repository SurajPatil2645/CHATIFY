import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    let user;

    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (decoded && decoded.id) {
          user = await User.findById(decoded.id).select("-password");
        }
      } catch (err) {
        console.log("JWT verification failed in socket auth:", err.message);
      }
    }

    // Fallback to query userId if cookie is withheld cross-origin in dev
    if (!user && socket.handshake.query?.userId) {
      const queryUserId = socket.handshake.query.userId;
      if (queryUserId && queryUserId !== "undefined") {
        user = await User.findById(queryUserId).select("-password");
      }
    }

    if (!user) {
      console.log("Socket connection rejected: User not authenticated");
      return next(new Error("Unauthorized - Authentication failed"));
    }

    socket.user = user;
    socket.userId = user._id.toString();

    console.log(
      `Socket authenticated for user: ${user.fullname} (${user._id})`
    );

    next();
  } catch (error) {
    console.log("Error in socket authentication:", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};