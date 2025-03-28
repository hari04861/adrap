import express from 'express';
import { addQuestions } from '../controllers/questions.js';

const router = express.Router();

router.post('/', addQuestions);

export default router;
