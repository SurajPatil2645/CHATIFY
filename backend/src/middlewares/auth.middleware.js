import { ENV } from '../lib/env.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
    console.log("Protect route middleware invoked");
    const token = req.cookies.token;
    console.log("Token from cookies:", token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if(!decoded || !decoded.id) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ message: "Unauthorized access" });
    }
};