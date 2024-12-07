import { Router } from 'express';
import { chatWithAI } from '../controllers/chatbot.controller.js';

const router = Router();

router.route('/chat').post(chatWithAI);

export default router;
