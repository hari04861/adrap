import { pool } from '../config/db.js';

// Get all test records (basic test info)
export const getAllTests = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM serial_tests');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching test records:', error);
    res.status(500).json({ error: 'Failed to fetch test records' });
  }
};

// Create a new test record
export const createTest = async (req, res) => {
  try {
    const { subjectId, serialTestNumber, batch, section } = req.body;
    const [result] = await pool.query(
      'INSERT INTO serial_tests (subjectId, serialTestNumber, batch, section) VALUES (?, ?, ?, ?)',
      [subjectId, serialTestNumber, batch, section]
    );
    const newTest = {
      id: result.insertId,
      subjectId,
      serialTestNumber,
      batch,
      section,
    };
    console.log("✅ Test record created:", newTest);
    res.status(201).json({ message: 'Test record created successfully', test: newTest });
  } catch (error) {
    console.error("❌ Error creating test record:", error);
    res.status(500).json({ error: 'Failed to create test record' });
  }
};

// Delete a test record
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM serial_tests WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Test record not found' });
    }
    res.json({ message: 'Test record deleted successfully' });
  } catch (error) {
    console.error("❌ Error deleting test record:", error);
    res.status(500).json({ error: 'Failed to delete test record' });
  }
};

