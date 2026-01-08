import express from 'express';
import { getChats, getMessages, getOrCreateDirectChat, getUsers, createChat, markMessagesRead as markMessagesAsReadController } from '../controllers/chatController';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = express.Router();

router.use(authenticateToken); // Apply auth middleware to all chat routes

router.get('/', getChats);
router.get('/:chatId/messages', getMessages);
router.post('/dm', getOrCreateDirectChat);
router.get('/users', getUsers);
router.post('/create', createChat);
router.post('/mark-read', markMessagesAsReadController);

export default router;
