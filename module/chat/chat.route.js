import express from 'express';
import auth from '../../middlewares/authenticate.js';
import { getConversations, getMessages } from './chat.controller.js';

const router = express.Router();

router.get('/conversations', auth.authenticate, getConversations);
router.get('/messages', auth.authenticate, getMessages);

export default router;
