import express from 'express';
import { addStudentMarks, updateStudentMarks, resetStudentMarks } from '../controllers/studentMarks.js';

const router = express.Router();

// Endpoint for adding student marks
router.post('/', addStudentMarks);

// Endpoint for updating student marks
router.put('/update', updateStudentMarks);

// Endpoint for resetting student marks
router.post('/:testId/:rollNumber/reset', resetStudentMarks);

export default router;
