import express from 'express';
import {
    getAllContacts,
    getMessagesByUserId,
    sendMessage,
    getChatPartners,
    markAsRead,
    reactToMessage,
    editMessage,
    deleteMessage
} from '../controllers/message.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { arcjetMiddleware } from '../middlewares/arcjet.middleware.js';

const router = express.Router();

router.use(arcjetMiddleware, protectRoute);

router.get('/contacts', getAllContacts);
router.get('/chats', getChatPartners);
router.get('/:id', getMessagesByUserId);
router.post('/send/:id', sendMessage);
router.put('/mark-read/:id', markAsRead);
router.put('/react/:id', reactToMessage);
router.put('/edit/:id', editMessage);
router.delete('/delete/:id', deleteMessage);

export default router;