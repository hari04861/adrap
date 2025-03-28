import { pool } from '../config/db.js';

export const addStudentMarks = async (req, res) => {
  try {
    const { testId, studentMarks } = req.body;
    if (!Array.isArray(studentMarks) || studentMarks.length === 0) {
      return res.status(400).json({ error: "No student marks provided" });
    }
    // Prepare values for bulk insert:
    // For each student row, insert testId, rollNumber, name, submitted,
    // and default JSON values for coMarks and questionMarks.
    const values = studentMarks.map(s => [
      testId, 
      s.rollNumber, 
      s.name, 
      s.submitted ? 1 : 0,
      JSON.stringify([]),  // default empty array for coMarks
      JSON.stringify({})   // default empty object for questionMarks
    ]);
    
    await pool.query(
      'INSERT INTO student_marks (testId, rollNumber, name, submitted, coMarks, questionMarks) VALUES ?',
      [values]
    );
    console.log("✅ Student marks added for testId:", testId);
    res.status(201).json({ message: "Student marks added successfully" });
  } catch (error) {
    console.error("❌ Error adding student marks:", error);
    res.status(500).json({ error: "Failed to add student marks" });
  }
};

export const updateStudentMarks = async (req, res) => {
  try {
    const { testId, rollNumber, coMarks, questionMarks } = req.body;
    const coMarksStr = JSON.stringify(coMarks);
    const questionMarksStr = JSON.stringify(questionMarks);
    
    const [result] = await pool.query(
      'UPDATE student_marks SET submitted = ?, coMarks = ?, questionMarks = ? WHERE testId = ? AND rollNumber = ?',
      [true, coMarksStr, questionMarksStr, testId, rollNumber]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student marks record not found" });
    }
    res.json({ message: "Student marks updated successfully" });
  } catch (error) {
    console.error("Error updating student marks:", error);
    res.status(500).json({ error: "Failed to update student marks" });
  }
};

// Reset student marks for a specific test and student
export const resetStudentMarks = async (req, res) => {
  const { testId, rollNumber } = req.params;

  try {
    // Update the student marks record
    const [result] = await pool.query(
      `UPDATE student_marks 
       SET questionMarks = '{}', 
           coMarks = '[]', 
           submitted = false 
       WHERE testId = ? AND rollNumber = ?`,
      [testId, rollNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student marks not found" });
    }

    // Fetch the updated record
    const [updatedRecord] = await pool.query(
      `SELECT * FROM student_marks 
       WHERE testId = ? AND rollNumber = ?`,
      [testId, rollNumber]
    );

    res.json({
      message: "Student marks reset successfully",
      student: {
        rollNumber: updatedRecord[0].rollNumber,
        submitted: false,
        questionMarks: {},
        coMarks: []
      }
    });
  } catch (error) {
    console.error("Error resetting student marks:", error);
    res.status(500).json({ error: "Failed to reset student marks" });
  }
};
