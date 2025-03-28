import { pool } from '../config/db.js';

// Insert questions for a given test
export const addQuestions = async (req, res) => {
  try {
    const { testId, questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "No questions provided" });
    }
    // Prepare values for bulk insert: each row is [testId, questionNumber, co, maxMarks]
    const values = questions.map(q => [testId, q.questionNumber, q.co, q.maxMarks]);
    await pool.query(
      'INSERT INTO questions (testId, questionNumber, co, maxMarks) VALUES ?',
      [values]
    );
    console.log("✅ Questions added for testId:", testId);
    res.status(201).json({ message: "Questions added successfully" });
  } catch (error) {
    console.error("❌ Error adding questions:", error);
    res.status(500).json({ error: "Failed to add questions" });
  }
};
