import express from 'express';
import { getAllTests, createTest, deleteTest } from '../controllers/serialTests.js';

const router = express.Router();

router.get('/', getAllTests);
router.post('/', createTest);
router.delete('/:id', deleteTest);

export default router;
