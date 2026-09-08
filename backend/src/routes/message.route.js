import express from 'express';
import { getAllContacts, getMessagesByUserId, sendMessage, getChatPartners } from '../controllers/message.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { arcjetMiddleware } from '../middlewares/arcjet.middleware.js';

const router = express.Router();

// the middlewares are applied in the order they are defined. So, arcjetMiddleware will run first, followed by protectRoute.
// This ensures that the request is first validated by Arcjet and then checked for authentication.
router.use(arcjetMiddleware, protectRoute);

router.get('/contacts', getAllContacts);
router.get('/chats', getChatPartners);
router.get('/:id', getMessagesByUserId);
router.post('/send/:id', sendMessage);

export default router;