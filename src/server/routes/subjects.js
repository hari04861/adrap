import express from 'express';
import * as subjectsController from '../controllers/subjects.js';

const router = express.Router();

router.get('/', subjectsController.getAllSubjects);
router.post('/', subjectsController.addSubject);
router.delete('/:id', subjectsController.removeSubject);
router.get('/semester/:semester/batch/:batch/section/:section', subjectsController.getSubjectsBySemester);
router.get('/faculty/:username', subjectsController.getSubjectsByFaculty);
router.get('/student/:username', subjectsController.getSubjectsByStudent); // Added endpoint for students
router.post('/reset', subjectsController.resetSubjects);
router.post('/publish', subjectsController.publishSubjects);
router.get('/published', subjectsController.getSubjectsPublished);

export default router;
