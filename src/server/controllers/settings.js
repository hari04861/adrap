import { pool } from '../config/db.js';

// Set batch and section settings
export const setBatchSection = async (req, res) => {
  try {
    const { batch, section } = req.body;
    await pool.query('UPDATE app_settings SET value = ? WHERE name = ?', [batch, 'current_batch']);
    await pool.query('UPDATE app_settings SET value = ? WHERE name = ?', [section, 'current_section']);
    res.json({ message: 'Batch and section updated successfully' });
  } catch (error) {
    console.error('Error updating batch and section:', error);
    res.status(500).json({ error: 'Failed to update batch and section' });
  }
};

// Get current batch and section
export const getBatchSection = async (req, res) => {
  try {
    const [batchRows] = await pool.query('SELECT value FROM app_settings WHERE name = ?', ['current_batch']);
    const [sectionRows] = await pool.query('SELECT value FROM app_settings WHERE name = ?', ['current_section']);
    res.json({
      currentBatch: batchRows[0]?.value || '2022-2026',
      currentSection: sectionRows[0]?.value || 'A'
    });
  } catch (error) {
    console.error('Error fetching batch and section:', error);
    res.status(500).json({ error: 'Failed to fetch batch and section' });
  }
};
