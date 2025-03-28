import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { pool, testConnection } from './config/db.js';

// Import route modules
import subjectsRoutes from './routes/subjects.js';
import authRoutes from './routes/auth.js';
import serialTestsRoutes from './routes/serialTests.js';
import questionsRoutes from './routes/questions.js';
import studentMarksRoutes from './routes/studentmarks.js';  // Ensure correct import
import settingsRoutes from './routes/settings.js';
import exportTestRoutes from './routes/exportTest.js';
import studentTestRoutes from './routes/studentTest.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test endpoint to verify database connection
app.get('/api/test', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    const result = await testConnection();
    res.json({
      message: 'Database connected successfully!',
      dbResult: rows[0].result,
      testResult: result
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  }
});

// Register API Routes
app.use('/api/subjects', subjectsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/serialtests', serialTestsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/studentmarks', studentMarksRoutes); // Register student marks routes
app.use('/api/settings', settingsRoutes);
app.use('/api/export', exportTestRoutes);
app.use('/api/studentTest', studentTestRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
