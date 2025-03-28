import { pool } from "../config/db.js";

export const getStudentTest = async (req, res) => {
  const { subjectId, serialTestNumber, batch, section, rollNumber } = req.query;

  console.log("Received request with params:", { subjectId, serialTestNumber, batch, section, rollNumber });

  try {
    // 1. Get the test record with subject details.
    const [testResult] = await pool.query(
      `SELECT t.*, s.code as subjectCode, s.name as subjectName 
       FROM serial_tests t 
       JOIN subjects s ON t.subjectId = s.id 
       WHERE t.subjectId = ? AND t.serialTestNumber = ? AND t.batch = ? AND t.section = ?`,
      [subjectId, serialTestNumber, batch, section]
    );

    console.log("Test result:", testResult);

    if (testResult.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }
    const test = testResult[0];

    // 2. Get questions for this test with proper ordering
    const [questionsResult] = await pool.query(
      `SELECT q.*, 
              CASE 
                WHEN q.questionNumber <= 10 THEN 'Part A'
                ELSE 'Part B'
              END as part
       FROM questions q 
       WHERE q.testId = ? 
       ORDER BY 
         CASE 
           WHEN q.questionNumber <= 10 THEN 1
           ELSE 2
         END,
         CAST(q.questionNumber AS UNSIGNED)`,
      [test.id]
    );

    console.log("Questions result:", questionsResult);

    // 3. Get student marks for this test.
    const [studentResult] = await pool.query(
      `SELECT * FROM student_marks 
       WHERE testId = ? AND rollNumber = ?`,
      [test.id, rollNumber]
    );

    console.log("Student result:", studentResult);

    if (studentResult.length === 0) {
      return res.status(404).json({ error: "Student not found for this test" });
    }
    const studentData = studentResult[0];

    // 4. Handle questionMarks and coMarks data
    let questionMarks = {};
    let coMarks = [];

    // Handle questionMarks
    if (studentData.questionMarks) {
      try {
        questionMarks = typeof studentData.questionMarks === 'string' 
          ? JSON.parse(studentData.questionMarks) 
          : studentData.questionMarks;
      } catch (e) {
        console.error("Error handling questionMarks:", e);
        questionMarks = {};
      }
    }

    // Handle coMarks
    if (studentData.coMarks) {
      try {
        coMarks = typeof studentData.coMarks === 'string' 
          ? JSON.parse(studentData.coMarks) 
          : studentData.coMarks;
      } catch (e) {
        console.error("Error handling coMarks:", e);
        coMarks = [];
      }
    }

    // 5. Organize questions by part (Part A and Part B)
    const partAQuestions = questionsResult.filter(q => q.part === "Part A");
    const partBQuestions = questionsResult.filter(q => q.part === "Part B");

    console.log("Organized questions:", { partAQuestions, partBQuestions });

    // 6. Return the assembled data
    const response = {
      test: {
        id: test.id,
        subjectCode: test.subjectCode,
        subjectName: test.subjectName,
        serialTestNumber: test.serialTestNumber,
        batch: test.batch,
        section: test.section,
      },
      questions: {
        partA: partAQuestions,
        partB: partBQuestions,
      },
      studentName: studentData.name,
      submitted: studentData.submitted,
      questionMarks,
      coMarks,
    };

    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error fetching student test data:", error);
    res.status(500).json({ error: "Failed to fetch test data" });
  }
};
