import express from 'express';
import { setBatchSection, getBatchSection } from '../controllers/settings.js';

const router = express.Router();

router.post('/batchsection', setBatchSection);
router.get('/batchsection', getBatchSection);

export default router;
