import express from 'express';
import { getStudentTest } from '../controllers/studentTest.js';

const router = express.Router();

// GET /api/studentTest - Get test data for a student
router.get('/', getStudentTest);

export default router;
