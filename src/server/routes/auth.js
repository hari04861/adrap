import express from 'express';
import * as authController from '../controllers/auth.js';

const router = express.Router();

router.post('/faculty', authController.validateFaculty);
router.post('/student', authController.validateStudent);
router.post("/logout", (req, res) => {
    res.status(200).json({ message: "Logout successful. Remove JWT on frontend." });
  });
  

export default router;
