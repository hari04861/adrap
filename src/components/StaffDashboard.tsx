import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import {
  Upload,
  BookOpen,
  LogOut,
  AlertCircle,
  Plus,
  Trash2,
  HelpCircle,
  Download,
  RefreshCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export interface QuestionMark {
  questionNumber: string;
  co: number;
  maxMarks: number | string;
  part?: "A" | "B"; // <-- Add a "part" property to track Part A or B
}

interface ExportData {
  test: {
    id: string;
    serialTestNumber: number;
    batch: string;
    section: string;
  };
  students: Array<{
    rollNumber: number;
    name: string;
    submitted: boolean;
    questionMarks: Record<string, number>;
    coMarks: number[];
  }>;
}

function StaffDashboard() {
  // Selection states
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState<string>("2022-2026");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<string>("2023-2024");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<1 | 2>(1);

  // Part A / Part B question states
  const [questionMarks, setQuestionMarks] = useState<QuestionMark[]>([]);
  const [partAQuestions, setPartAQuestions] = useState<QuestionMark[]>([]);
  const [partBQuestions, setPartBQuestions] = useState<QuestionMark[]>([]);
  const [showColumns, setShowColumns] = useState<boolean>(false);
  const [showQuestionParts, setShowQuestionParts] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<"A" | "B" | null>(null);

  // Fixed Part A questions
  const [fixedPartAQuestions] = useState<QuestionMark[]>([
    { questionNumber: "1", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "2", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "3", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "4", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "5", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "6", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "7", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "8", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "9", co: 1, maxMarks: 2, part: "A" },
    { questionNumber: "10", co: 1, maxMarks: 2, part: "A" },
  ]);

  // File input ref and state for uploaded file name
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Retrieve store state and functions
  const user = useStore((state) => state.user);
  const subjectsPublished = useStore((state) => state.subjectsPublished);
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  // Fetched subjects and test data
  const [facultySubjects, setFacultySubjects] = useState<any[]>([]);
  const [testRecord, setTestRecord] = useState<any>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  // For dropdowns
  const currentYearVal = new Date().getFullYear();
  const batches = Array.from(
    { length: 10 },
    (_, i) => `${currentYearVal - i}-${currentYearVal - i + 4}`
  );
  const academicYears = Array.from(
    { length: 10 },
    (_, i) => `${currentYearVal - i}-${currentYearVal - i + 1}`
  );
  const sections = ["A", "B", "C"];

  // ============ PART A / PART B Handlers =============
  const handleQuestionClick = () => {
    setShowQuestionParts(true);
    setSelectedPart(null);
    setShowColumns(false);
  };

  const handlePartAClick = () => {
    setSelectedPart("A");
    setShowColumns(true);
    setQuestionMarks(partAQuestions);
  };

  const handlePartBClick = () => {
    setSelectedPart("B");
    setShowColumns(true);
    setQuestionMarks(partBQuestions);
  };

  // Add new question for Part B
  const addQuestion = () => {
    const newQuestion: QuestionMark = {
      questionNumber: "",
      co: 1,
      maxMarks: "",
      part: "B",
    };
    setShowColumns(true);
    const updated = [...questionMarks, newQuestion];
    setQuestionMarks(updated);
    setPartBQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questionMarks.filter((_, i) => i !== index);
    setQuestionMarks(updated);
    setPartBQuestions(updated);
    if (updated.length === 0) setShowColumns(false);
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionMark,
    value: string | number
  ) => {
    const updated = [...questionMarks];
    if (field === "maxMarks") {
      updated[index][field] = value === "" ? "" : Number(value);
    } else {
      (updated[index][field] as typeof value) = value;
    }
    setQuestionMarks(updated);

    // Update the correct part array
    if (selectedPart === "A") {
      const newA = [...partAQuestions];
      newA[index] = { ...newA[index], [field]: value };
      setPartAQuestions(newA);
    } else if (selectedPart === "B") {
      setPartBQuestions(updated);
    }
  };

  // ============ Fetch subjects for faculty user ============
  useEffect(() => {
    if (!user?.username) return;
    const fetchSubjects = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/subjects/faculty/${user.username}`
        );
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const subjects = await response.json();
        console.log("Fetched subjects:", subjects);
        setFacultySubjects(subjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setFacultySubjects([]);
      }
    };
    fetchSubjects();
  }, [user]);

  // ============ Filter subjects by selection criteria ============
  const semesterSubjects = React.useMemo(() => {
    const filtered = facultySubjects.filter(
      (subject) =>
        subject.semester === selectedSemester &&
        subject.batch === selectedBatch &&
        subject.section === selectedSection &&
        subject.academicYear === selectedAcademicYear
    );
    console.log("Filtered subjects:", filtered);
    return filtered;
  }, [
    facultySubjects,
    selectedSemester,
    selectedBatch,
    selectedSection,
    selectedAcademicYear,
  ]);

  // ============ Reset when selection changes ============
  useEffect(() => {
    setSelectedSubject("");
    setSelectedTest(1);
    setTestRecord(null);
    setExportData(null);
    setUploadedFileName(null);
  }, [selectedBatch, selectedSemester, selectedAcademicYear, selectedSection]);

  // ============ Reset state when selectedTest changes ============
  useEffect(() => {
    setTestRecord(null);
    setExportData(null);
    setUploadedFileName(null);
    setShowQuestionParts(false);
    setSelectedPart(null);
    setPartBQuestions([]);
    setQuestionMarks([]);
    setShowColumns(false);
    setPartAQuestions([...fixedPartAQuestions]);
  }, [selectedTest, fixedPartAQuestions]);

  // ============ Check for existing test record ============
  useEffect(() => {
    const fetchExistingTest = async () => {
      if (!selectedSubject) {
        setTestRecord(null);
        setExportData(null);
        return;
      }
      try {
        const response = await fetch("http://localhost:3000/api/serialtests");
        if (!response.ok) throw new Error("Failed to fetch test records");
        const tests = await response.json();
        const existingTest = tests.find(
          (t: any) =>
            t.subjectId === selectedSubject &&
            t.serialTestNumber === selectedTest &&
            t.batch === selectedBatch &&
            t.section === selectedSection
        );
        if (existingTest) {
          setTestRecord(existingTest);
          // fetch export data
          const exportRes = await fetch(
            `http://localhost:3000/api/export/${existingTest.id}/export`
          );
          if (exportRes.ok) {
            const exData = await exportRes.json();
            setExportData(exData);
          } else {
            console.error("Failed to fetch export data");
            setExportData(null);
          }
        } else {
          setTestRecord(null);
          setExportData(null);
        }
      } catch (error) {
        console.error("Error fetching existing test record:", error);
        setTestRecord(null);
        setExportData(null);
      }
    };
    fetchExistingTest();
  }, [selectedSubject, selectedTest, selectedBatch, selectedSection]);

  // ============ File Upload =============
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (testRecord) {
      alert(
        "Test data for this subject and test already exists. Please use the existing test."
      );
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      console.log("handleFileUpload triggered");
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        if (typeof bstr === "string") {
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          console.log("📁 Extracted Student Data:", data);
          const studentMarks = data.map((row: any) => ({
            rollNumber: Number(row["Register Number"]),
            name: row["Name"],
            submitted: false,
          }));
          console.log("📝 Final Student Marks Array:", studentMarks);

          const newTestRecord = {
            subjectId: selectedSubject,
            serialTestNumber: selectedTest,
            batch: selectedBatch,
            section: selectedSection,
          };

          try {
            // 1. Create test record
            const testRes = await fetch(
              "http://localhost:3000/api/serialtests",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTestRecord),
              }
            );
            if (!testRes.ok) {
              const errorMsg = await testRes.text();
              throw new Error(`Failed to create test record: ${errorMsg}`);
            }
            const createdTest = await testRes.json();
            console.log("Created Test Record:", createdTest);
            const testId = createdTest.test.id;
            setTestRecord(createdTest.test);

            // 2. Insert questions (make sure we include the "part" property)
            const allQuestions = [
              ...partAQuestions.map((q) => ({ ...q, part: "A" })),
              ...partBQuestions.map((q) => ({ ...q, part: "B" })),
            ];

            const questionsRes = await fetch(
              "http://localhost:3000/api/questions",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testId, questions: allQuestions }),
              }
            );
            if (!questionsRes.ok) {
              const errorMsg = await questionsRes.text();
              throw new Error(`Failed to create questions: ${errorMsg}`);
            }

            // 3. Insert student marks
            const studentRes = await fetch(
              "http://localhost:3000/api/studentmarks",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testId, studentMarks }),
              }
            );
            if (!studentRes.ok) {
              const errorMsg = await studentRes.text();
              throw new Error(`Failed to create student marks: ${errorMsg}`);
            }

            // 4. Fetch the new test record's export data for immediate display
            const exportRes = await fetch(
              `http://localhost:3000/api/export/${testId}/export`
            );
            if (exportRes.ok) {
              const exData = await exportRes.json();
              setExportData(exData);
            } else {
              console.error("Failed to fetch export data after upload");
              setExportData(null);
            }

            // Set the uploaded file name so it shows in the UI
            setUploadedFileName(file.name);

            alert("✅ Test data uploaded successfully!");
          } catch (error) {
            console.error("❌ Error in test creation:", error);
            alert("⚠️ Failed to upload test data. Please try again.");
          }
        }
      };
      reader.readAsBinaryString(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Handler to delete the uploaded file and associated test record/details
  const handleDeleteFile = async () => {
    if (!testRecord) return;
    try {
      // Call DELETE API to remove test record
      const response = await fetch(
        `http://localhost:3000/api/serialtests/${testRecord.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete test record: ${errorText}`);
      }
      // Clear state
      setTestRecord(null);
      setExportData(null);
      setUploadedFileName(null);
      alert("File and associated details deleted successfully.");
    } catch (error) {
      console.error("Error deleting file details:", error);
      alert("Failed to delete file details. Please try again.");
    }
  };

  // ============ Updated Student Status UI ============
  const renderStudentStatus = () => {
    if (!exportData || !exportData.students || exportData.students.length === 0)
      return null;

    // Find the selected subject details from semesterSubjects
    const selectedSubjectDetails = semesterSubjects.find(
      (subject) => subject.id === selectedSubject
    );

    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Student Status</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Test Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Subject</p>
              <p className="font-medium">
                {selectedSubjectDetails
                  ? `${selectedSubjectDetails.code} - ${selectedSubjectDetails.name}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Serial Test</p>
              <p className="font-medium">{exportData.test.serialTestNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Batch</p>
              <p className="font-medium">{exportData.test.batch}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Section</p>
              <p className="font-medium">{exportData.test.section}</p>
            </div>
          </div>
        </div>
        {exportData.students.map((student: any) => (
          <div
            key={student.rollNumber}
            className="flex items-center justify-between bg-white shadow-sm rounded-md px-4 py-3 mb-3"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-700">
                {student.name}
              </h3>
              <p className="text-sm text-gray-500">
                Register Number: {student.rollNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${student.submitted
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-600"
                  }`}
              >
                {student.submitted ? "Submitted" : "Pending"}
              </span>
              <button
                onClick={() =>
                  handleRefreshStudent(student.rollNumber.toString())
                }
                className="p-2 rounded-full hover:bg-gray-100"
                title="Refresh Student Status"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Handler to refresh export data (student status)
  const handleRefreshStudent = async (rollNumber: string) => {
    try {
      if (!testRecord?.id) {
        throw new Error("No test record found");
      }

      // Reset the student's marks
      const response = await fetch(
        `http://localhost:3000/api/studentmarks/${testRecord.id}/${rollNumber}/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionMarks: {},
            coMarks: [],
            submitted: false,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset student marks: ${errorText}`);
      }

      // Fetch updated export data to refresh the UI
      const exportRes = await fetch(
        `http://localhost:3000/api/export/${testRecord.id}/export`
      );

      if (!exportRes.ok) {
        throw new Error("Failed to fetch updated student status");
      }

      const updatedData = await exportRes.json();
      setExportData(updatedData);

      alert(
        "Student marks reset successfully. The student can now enter their marks again."
      );
    } catch (error) {
      console.error("Error resetting student marks:", error);
      alert("Failed to reset student marks. Please try again.");
    }
  };

  // handleExport with single-row header
  const handleExport = async () => {
    if (!testRecord) return;
    try {
      // 1) Fetch the export data from your backend
      const exportRes = await fetch(
        `http://localhost:3000/api/export/${testRecord.id}/export`
      );
      if (!exportRes.ok) {
        const errorMsg = await exportRes.text();
        throw new Error(`Export failed: ${errorMsg}`);
      }
      const exportData = await exportRes.json();

      // 2) Destructure the data
      const { test, questions, students } = exportData;

      // 3) Get the selected subject details from semesterSubjects
      const selectedSubjectDetails = semesterSubjects.find(
        (subject) => subject.id === selectedSubject
      );

      if (!selectedSubjectDetails) {
        throw new Error("Subject details not found");
      }

      // 4) Build the header rows (metadata)
      const headerRows = [
        ["Academic Year:", selectedAcademicYear],
        ["Batch:", test.batch],
        ["Subject Code:", selectedSubjectDetails.code],
        ["Subject Name:", selectedSubjectDetails.name],
        ["Serial Test:", test.serialTestNumber],
        ["Section:", test.section],
        [""], // blank row
      ];

      // 5) Build the question headers
      const questionHeaders = ["Register Number", "Name", "Submitted"];
      const coHeaders = ["", "", ""];

      // Sort questions to maintain consistent order
      const sortedQuestions = [...questions].sort((a, b) => {
        // Extract the main question number for comparison
        const getMainNumber = (str: string) => {
          const match = str.match(/^\d+/);
          return match ? parseInt(match[0]) : 0;
        };

        const aNum = getMainNumber(a.questionNumber);
        const bNum = getMainNumber(b.questionNumber);

        if (aNum !== bNum) return aNum - bNum;

        // If main numbers are the same, use full string comparison
        return a.questionNumber.localeCompare(b.questionNumber, undefined, {
          numeric: true,
        });
      });

      // Add question columns + CO columns
      sortedQuestions.forEach((q: any) => {
        questionHeaders.push(`Q${q.questionNumber}`);
        coHeaders.push(`CO${q.co}`);
      });

      // Add total columns
      questionHeaders.push("Total Marks", "");
      coHeaders.push("", "");
      for (let i = 1; i <= 5; i++) {
        questionHeaders.push(`CO${i} Total`);
        coHeaders.push("");
      }

      // 6) Build the student data rows
      const studentData = students.map((student: any) => {
        const row = [
          student.rollNumber,
          student.name,
          student.submitted ? "Yes" : "No",
        ];

        // Parse questionMarks if it's a string
        let sQMarks = student.questionMarks;
        if (typeof sQMarks === "string") {
          try {
            sQMarks = JSON.parse(sQMarks);
          } catch {
            sQMarks = {};
          }
        }

        // Add marks for each question in the sorted order
        sortedQuestions.forEach((q: any) => {
          const mark = sQMarks?.[q.questionNumber] || 0;
          row.push(mark);
        });

        // Calculate CO totals
        const coTotals = new Array(5).fill(0);
        if (student.submitted) {
          sortedQuestions.forEach((q: any) => {
            const mark = sQMarks?.[q.questionNumber] || 0;
            if (q.co >= 1 && q.co <= 5) {
              coTotals[q.co - 1] += mark;
            }
          });
        }

        const totalMarks = coTotals.reduce((sum, m) => sum + m, 0);
        row.push(totalMarks, "");
        coTotals.forEach((total) => row.push(total));
        return row;
      });

      const worksheetData = [
        ...headerRows,
        questionHeaders,
        coHeaders,
        ...studentData,
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Marks");
      const fileName = `${selectedSubjectDetails.code}_ST${test.serialTestNumber}_${test.batch}_${test.section}_marks.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting test data:", error);
      alert("Failed to export test data.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  // ============ On Subject or Test change, fetch existing question data ============
  useEffect(() => {
    const fetchTestData = async () => {
      if (!selectedSubject) {
        // Reset everything if no subject is selected
        setSelectedTest(1);
        setShowQuestionParts(false);
        setSelectedPart(null);
        setPartBQuestions([]);
        setQuestionMarks([]);
        setShowColumns(false);
        setPartAQuestions([...fixedPartAQuestions]);
        return;
      }

      try {
        // 1) Check if a test record exists for this subject + test
        const testResponse = await fetch(
          `http://localhost:3000/api/serialtests?subjectId=${selectedSubject}&serialTestNumber=${selectedTest}`
        );
        if (testResponse.ok) {
          const tests = await testResponse.json();
          const testData = tests[0]; // If there's at least one match, we take the first

          if (testData) {
            // 2) If the test exists, fetch its questions
            const questionsResponse = await fetch(
              `http://localhost:3000/api/questions/test/${testData.id}`
            );
            if (questionsResponse.ok) {
              const questionsData = await questionsResponse.json();

              // Separate Part A and Part B questions
              const partA = questionsData.filter((q: any) => q.part === "A");
              const partB = questionsData.filter((q: any) => q.part === "B");

              // Update state with the fetched questions
              setPartAQuestions(
                partA.length > 0 ? partA : [...fixedPartAQuestions]
              );
              setPartBQuestions(partB);

              // By default, show whichever part is actually present
              if (partB.length > 0) {
                setSelectedPart("B");
                setQuestionMarks(partB);
              } else {
                setSelectedPart("A");
                setQuestionMarks(
                  partA.length > 0 ? partA : [...fixedPartAQuestions]
                );
              }

              setShowColumns(true);
              setShowQuestionParts(true);
            }
          } else {
            // If no test record exists, reset to default
            setPartAQuestions([...fixedPartAQuestions]);
            setPartBQuestions([]);
            setQuestionMarks([]);
            setShowColumns(false);
            setShowQuestionParts(false);
            setSelectedPart(null);
          }
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
      }
    };

    fetchTestData();
  }, [selectedSubject, selectedTest, fixedPartAQuestions]);

  return (
    <>
      {/* Inline style to remove number input arrows */}
      <style>{`
        /* Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="min-h-screen p-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">
                Faculty Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!subjectsPublished ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Subjects Not Available Yet
                </h2>
                <p className="text-gray-600">
                  Please wait for the admin to publish the subjects list.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Academic Year, Batch, Section, Semester */}
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <select
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {academicYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Batch
                    </label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Section
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {sections.map((section) => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Semester
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) =>
                        setSelectedSemester(Number(e.target.value))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a subject</option>
                    {semesterSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial Test selection */}
                {selectedSubject && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Serial Test
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setSelectedTest(1)}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${selectedTest === 1
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          Serial Test 1
                        </button>
                        <button
                          onClick={() => setSelectedTest(2)}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${selectedTest === 2
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          Serial Test 2
                        </button>
                      </div>
                    </div>

                    {/* Question-CO Mapping Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          Question-CO Mapping
                        </h3>
                        <button
                          onClick={handleQuestionClick}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <HelpCircle size={20} />
                          Question
                        </button>
                      </div>
                      {showQuestionParts && (
                        <div className="flex gap-4 justify-center my-4">
                          <button
                            onClick={handlePartAClick}
                            className={`px-6 py-3 rounded-lg transition-colors ${selectedPart === "A"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            Part A
                          </button>
                          <button
                            onClick={handlePartBClick}
                            className={`px-6 py-3 rounded-lg transition-colors ${selectedPart === "B"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            Part B
                          </button>
                        </div>
                      )}

                      {selectedPart && (
                        <div className="space-y-4">
                          {selectedPart === "B" && (
                            <div className="flex justify-end">
                              <button
                                onClick={addQuestion}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <Plus size={20} />
                                Add Question
                              </button>
                            </div>
                          )}

                          {showColumns && (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Question Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      CO Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Max Marks
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {questionMarks.map((q, index) => (
                                    <tr
                                      key={index}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                          type="text"
                                          value={q.questionNumber}
                                          onChange={(e) =>
                                            updateQuestion(
                                              index,
                                              "questionNumber",
                                              e.target.value
                                            )
                                          }
                                          placeholder="e.g. 11(a)(i)"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                          value={q.co}
                                          onChange={(e) =>
                                            updateQuestion(
                                              index,
                                              "co",
                                              Number(e.target.value)
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                              CO {i + 1}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          pattern="[0-9]\.?[0-9]"
                                          value={q.maxMarks}
                                          onChange={(e) =>
                                            updateQuestion(
                                              index,
                                              "maxMarks",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Enter marks"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          disabled={selectedPart === "A"}
                                        />
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {/* Only show delete if this is Part B */}
                                        {selectedPart === "B" && (
                                          <button
                                            onClick={() =>
                                              removeQuestion(index)
                                            }
                                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                          >
                                            <Trash2 size={20} />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* File Upload / Export / Save section */}
                    <div className="space-y-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls"
                        className="hidden"
                      />
                      <h2 className="text-1xl font-bold text-gray-500 text-center my-4">
                        The uploaded Excel sheet must contain{" "}
                        <strong>"Register Number"</strong> and{" "}
                        <strong>"Name"</strong>
                      </h2>

                      {/* Upload Button Always Visible */}
                      <div className="flex gap-4">
                        <button
                          onClick={handleUploadClick}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Upload size={20} />
                          Upload Name List
                        </button>
                      </div>

                      {/* If we have either a file name or an existing test record, show "file name" + delete */}
                      {(uploadedFileName || testRecord) && (
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-700">
                            Uploaded File:{" "}
                            {uploadedFileName
                              ? uploadedFileName
                              : "Previously Uploaded"}
                          </span>
                          <button
                            onClick={handleDeleteFile}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                            title="Delete Uploaded File"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )}

                      {/* Student Status + Export if we have data */}
                      {exportData && (
                        <>
                          {renderStudentStatus()}
                          <div className="flex gap-4 mt-4">
                            <button
                              onClick={handleExport}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Download size={20} />
                              Export Mark Sheet
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default StaffDashboard;
