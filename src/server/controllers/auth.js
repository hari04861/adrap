import { pool } from '../config/db.js';

// Validate faculty credentials
export const validateFaculty = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM subjects WHERE username = ? AND password = ?',
      [username, password]
    );
    const isValid = rows.length > 0;
    res.json({ isValid });
  } catch (error) {
    console.error('Error validating faculty credentials:', error);
    res.status(500).json({ error: 'Failed to validate faculty credentials' });
  }
};

// Validate student credentials
export const validateStudent = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM subjects WHERE studentUsername = ? AND studentPassword = ?',
      [username, password]
    );
    const isValid = rows.length > 0;
    res.json({ isValid });
  } catch (error) {
    console.error('Error validating student credentials:', error);
    res.status(500).json({ error: 'Failed to validate student credentials' });
  }
};

export const validateAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    // You can store these in environment variables for security purposes.
    // For this example, we use fixed credentials.
    const adminUsername = 'admin';
    const adminPassword = 'Admin@123';  // Replace or load from process.env if needed

    const isValid = (username === adminUsername && password === adminPassword);
    res.json({ isValid });
  } catch (error) {
    console.error('Error validating admin credentials:', error);
    res.status(500).json({ error: 'Failed to validate admin credentials' });
  }
};