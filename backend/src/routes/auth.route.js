import express from 'express';
import { signup, signin, logout, updateProfile } from '../controllers/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { arcjetMiddleware } from '../middlewares/arcjet.middleware.js';

const router = express.Router();

router.use(arcjetMiddleware); // Apply Arcjet middleware to all routes in this router

router.post('/signup', signup);

router.post('/login', signin);

router.post('/logout', logout);

router.put('/update-profile', protectRoute, updateProfile);

router.get('/check', protectRoute, (req, res) => {
    return res.status(200).json({ message: "User is authenticated", user: req.user });
});

export default router;