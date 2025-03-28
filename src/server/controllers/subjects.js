import { pool } from "../config/db.js";

// Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM subjects");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

// Add a new subject
export const addSubject = async (req, res) => {
  try {
    const subject = req.body;
    const [result] = await pool.query(
      "INSERT INTO subjects (id, code, name, semester, batch, section, staffName, username, password, studentUsername, studentPassword, academicYear) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        subject.id,
        subject.code,
        subject.name,
        subject.semester,
        subject.batch,
        subject.section,
        subject.staffName,
        subject.username,
        subject.password,
        subject.studentUsername,
        subject.studentPassword,
        subject.academicYear,
      ]
    );
    res.status(201).json({ message: "Subject added successfully", id: subject.id });
  } catch (error) {
    console.error("Error adding subject:", error);
    res.status(500).json({ error: "Failed to add subject" });
  }
};

// Remove a subject and its related data across all tables
export const removeSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    
    // Start a transaction to ensure atomicity
    await pool.query("START TRANSACTION");

    // First, get all serial test IDs for this subject
    const [serialTests] = await pool.query("SELECT id FROM serial_tests WHERE subjectId = ?", [subjectId]);
    const serialTestIds = serialTests.map(test => test.id);

    // Delete student marks for all serial tests of this subject
    if (serialTestIds.length > 0) {
      await pool.query("DELETE FROM student_marks WHERE testId IN (?)", [serialTestIds]);
    }

    // Delete questions for all serial tests of this subject
    if (serialTestIds.length > 0) {
      await pool.query("DELETE FROM questions WHERE testId IN (?)", [serialTestIds]);
    }

    // Delete serial tests for this subject
    await pool.query("DELETE FROM serial_tests WHERE subjectId = ?", [subjectId]);

    // Finally, delete the subject
    const [result] = await pool.query("DELETE FROM subjects WHERE id = ?", [subjectId]);
    
    if (result.affectedRows === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Subject not found" });
    }

    await pool.query("COMMIT");
    res.json({ message: "Subject and related data removed successfully" });
  } catch (error) {
    console.error("Error removing subject:", error);
    await pool.query("ROLLBACK");
    res.status(500).json({ error: "Failed to remove subject" });
  }
};

// Get subjects by semester, batch, and section
export const getSubjectsBySemester = async (req, res) => {
  try {
    const { semester, batch, section } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM subjects WHERE semester = ? AND batch = ? AND section = ?",
      [semester, batch, section]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching subjects by semester:", error);
    res.status(500).json({ error: "Failed to fetch subjects by semester" });
  }
};

// Get subjects by faculty username
export const getSubjectsByFaculty = async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await pool.query("SELECT * FROM subjects WHERE username = ?", [username]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching subjects by faculty:", error);
    res.status(500).json({ error: "Failed to fetch subjects by faculty" });
  }
};

// Get subjects by student username
export const getSubjectsByStudent = async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await pool.query("SELECT * FROM subjects WHERE studentUsername = ?", [username]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching subjects by student:", error);
    res.status(500).json({ error: "Failed to fetch subjects by student" });
  }
};

// Reset all subjects and related data
export const resetSubjects = async (req, res) => {
  try {
    // Disable foreign key checks to allow truncating tables
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    // Truncate tables in order
    await pool.query("TRUNCATE TABLE questions");
    await pool.query("TRUNCATE TABLE student_marks");
    await pool.query("TRUNCATE TABLE serial_tests");
    await pool.query("TRUNCATE TABLE subjects");

    // Re-enable foreign key checks
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // Update app settings (e.g., unpublish subjects)
    await pool.query("UPDATE app_settings SET value = ? WHERE name = ?", ["false", "subjects_published"]);

    res.json({ message: "All subjects, tests, questions, and student marks reset successfully" });
  } catch (error) {
    console.error("Error resetting subjects:", error);
    res.status(500).json({ error: "Failed to reset subjects" });
  }
};

// Publish subjects
export const publishSubjects = async (req, res) => {
  try {
    await pool.query("UPDATE app_settings SET value = ? WHERE name = ?", ["true", "subjects_published"]);
    res.json({ message: "Subjects published successfully" });
  } catch (error) {
    console.error("Error publishing subjects:", error);
    res.status(500).json({ error: "Failed to publish subjects" });
  }
};

// Get subjects published status
export const getSubjectsPublished = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT value FROM app_settings WHERE name = ?", ["subjects_published"]);
    const published = rows[0]?.value === "true";
    res.json({ published });
  } catch (error) {
    console.error("Error fetching subjects published status:", error);
    res.status(500).json({ error: "Failed to fetch subjects published status" });
  }
};
