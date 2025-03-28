// routes/exportTest.js
import express from 'express';
import { exportTest } from '../controllers/exportTest.js';

const router = express.Router();

router.get('/:id/export', exportTest);

export default router;
