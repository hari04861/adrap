import { pool } from '../config/db.js';

export const exportTest = async (req, res) => {
  try {
    const { id } = req.params; // test id
    // Get the basic test record
    const [testRows] = await pool.query('SELECT * FROM serial_tests WHERE id = ?', [id]);
    if (testRows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    const test = testRows[0];

    // Get questions for the test
    const [questionRows] = await pool.query(
      'SELECT questionNumber, co, maxMarks FROM questions WHERE testId = ? ORDER BY id ASC',
      [id]
    );

    // Get student marks for the test, including the question marks (and coMarks if desired)
    const [studentRows] = await pool.query(
      'SELECT rollNumber, name, submitted, questionMarks, coMarks FROM student_marks WHERE testId = ?',
      [id]
    );

    // Build the export data object
    const exportData = {
      test, 
      questions: questionRows,
      students: studentRows,
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting test data:', error);
    res.status(500).json({ error: 'Failed to export test data' });
  }
};
