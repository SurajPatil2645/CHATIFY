import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import { sendWelcomeEmail } from '../emails/emailHandler.js';
import { ENV } from '../lib/env.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailregex.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            await newUser.save();
            generateToken(newUser._id, res);
            try {
                await sendWelcomeEmail(newUser.email, newUser.fullname, ENV.CLIENT_URL);
            } catch (error) {
                console.error("Error sending welcome email:", error);
            }
            return res.status(201).json({ message: "User created successfully" });
        } else {
            return res.status(400).json({ message: "Invalid user data" });
        }

    } catch (error) {
        const errorCode = error?.code === 11000 ? "DUPLICATE_KEY" : "SIGNUP_ERROR";
        console.error("Signup failed", {
            errorCode,
            operation: "signup",
            method: req.method,
            path: req.path,
        });
        if (errorCode === "DUPLICATE_KEY") {
            return res.status(400).json({ message: "User already exists" });
        }
        return res.status(500).json({ message: "Server error" });
    }
};

export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);
        return res.status(200).json({ message: "User logged in successfully" });

    } catch (error) {
        console.error("Signin failed:", error);
        return res.status(500).json({
            message: "Internal Server error",
            // error: error.message
        });
    }
};

export const logout = (_, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    return res.status(200).json({ message: "User logged out successfully" });
};

export const updateProfile = async (req, res) => {
    try{
        const { profilePicture, fullname, email } = req.body;
        const userId = req.user._id;

        if (!profilePicture && !fullname && !email) {
            return res.status(400).json({ message: "Please provide at least one field to update" });
        }

        const uploadResult = await cloudinary.uploader.upload(profilePicture, {
            folder: 'profile_pictures',
            width: 200,
            height: 200,
            crop: 'fill',
        });

        const updatedProfilePicture = uploadResult.secure_url;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: updatedProfilePicture, fullname, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Profile update failed:", error);
        return res.status(500).json({ message: "Internal Server Error" }
        )
    }
}