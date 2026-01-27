import express from 'express';
import { getChats, getMessages, getOrCreateDirectChat, getUsers, createChat, markMessagesRead as markMessagesAsReadController, makeAdmin, removeMember, addMembers, leaveChat } from '../controllers/chatController.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import validateResource from '../middlewares/validateResource.js';
import { getOrCreateDirectChatSchema, createChatSchema, markMessagesReadSchema, manageMemberSchema, addMembersSchema } from '../validators/chatValidator.js';

const router = express.Router();

router.get('/', getChats);

router.get('/:chatId/messages', getMessages);

router.post('/dm', validateResource(getOrCreateDirectChatSchema), getOrCreateDirectChat);

router.get('/users', getUsers);

router.post('/create', validateResource(createChatSchema), createChat);

router.post('/mark-read', validateResource(markMessagesReadSchema), markMessagesAsReadController);

router.post('/:chatId/add-members', validateResource(addMembersSchema), addMembers);

router.post('/:chatId/make-admin', validateResource(manageMemberSchema), makeAdmin);

router.post('/:chatId/remove-member', validateResource(manageMemberSchema), removeMember);

router.post('/:chatId/leave', leaveChat);

export default router;
