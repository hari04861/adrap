import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, ClipboardList, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

export interface QuestionMark {
  questionNumber: string;
  co: number;
  maxMarks: number;
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

function StudentDashboard() {
  // Selection states
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState("2022-2026");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2023-2024");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<1 | 2>(1);
  const [rollNumber, setRollNumber] = useState("");

  // State for subjects and test data
  const [subjectsBySelection, setSubjectsBySelection] = useState<any[]>([]);
  const [testData, setTestData] = useState<any>(null);

  // States for marks entry
  const [exceedMarks, setExceedMarks] = useState<{ [key: string]: boolean }>({});

  // State for student name and entry status
  const [entryStatus, setEntryStatus] = useState<string>("");

  // State variables for student data
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<{
    partA: any[];
    partB: any[];
  }>({
    partA: [],
    partB: [],
  });
  const [marks, setMarks] = useState<{ [key: string]: number }>({});
  const [coMarks, setCoMarks] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [studentName, setStudentName] = useState("");

  const navigate = useNavigate();

  // Dropdown arrays
  const currentYear = new Date().getFullYear();
  const batches = Array.from(
    { length: 10 },
    (_, i) => `${currentYear - i}-${currentYear - i + 4}`
  );
  const academicYears = Array.from(
    { length: 10 },
    (_, i) => `${currentYear - i}-${currentYear - i + 1}`
  );
  const sections = ["A", "B", "C"];
  const setUser = useStore((state) => state.setUser);
  const user = useStore((state) => state.user);

  // Reset selections when major criteria change
  useEffect(() => {
    setSelectedSubject("");
    setSelectedTest(1);
    setExceedMarks({});
    setRollNumber("");
    setTestData(null);
    setEntryStatus("");
  }, [selectedBatch, selectedSemester, selectedAcademicYear, selectedSection]);

  // Reset test data when subject changes
  useEffect(() => {
    setSelectedTest(1);
    setExceedMarks({});
    setTestData(null);
    setEntryStatus("");
  }, [selectedSubject]);

  // Reset test data when serial test changes
  useEffect(() => {
    setExceedMarks({});
    setTestData(null);
    setEntryStatus("");
  }, [selectedTest]);

  // Reset test data when section changes
  useEffect(() => {
    setRollNumber("");
    setTestData(null);
    setEntryStatus("");
  }, [selectedSection]);

  // Fetch subjects based on semester, batch, and section
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const url = `http://localhost:3000/api/subjects/semester/${selectedSemester}/batch/${selectedBatch}/section/${selectedSection}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch subjects: ${response.status} - ${errorText}`
          );
        }
        const data = await response.json();
        setSubjectsBySelection(data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjectsBySelection([]);
      }
    }
    fetchSubjects();
  }, [selectedSemester, selectedBatch, selectedSection]);

  // Filter subjects by academic year
  const semesterSubjects = useMemo(() => {
    return subjectsBySelection.filter(
      (subject) => subject.academicYear === selectedAcademicYear
    );
  }, [subjectsBySelection, selectedAcademicYear]);

  // Fetch subjects for logged-in student
  useEffect(() => {
    if (!user?.username) return;
    const fetchSubjects = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/subjects/student/${user.username}`
        );
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const subjects = await response.json();
        console.log("Fetched subjects:", subjects);
        setStudentSubjects(subjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setStudentSubjects([]);
      }
    };
    fetchSubjects();
  }, [user]);

  // Filter subjects for semester
  const semesterSubjectsFiltered = React.useMemo(() => {
    const filtered = studentSubjects.filter(
      (subject) =>
        subject.semester === selectedSemester &&
        subject.batch === selectedBatch &&
        subject.section === selectedSection &&
        subject.academicYear === selectedAcademicYear
    );
    console.log("Filtered subjects:", filtered);
    return filtered;
  }, [
    studentSubjects,
    selectedSemester,
    selectedBatch,
    selectedSection,
    selectedAcademicYear,
  ]);

  // Handle loading test data
  const handleLoadTest = async () => {
    if (!selectedSubject || !rollNumber) {
      alert("Please select a subject and enter your register number.");
      return;
    }
    try {
      const queryParams = new URLSearchParams({
        subjectId: selectedSubject,
        serialTestNumber: String(selectedTest),
        batch: selectedBatch,
        section: selectedSection,
        rollNumber: rollNumber,
      });
      const url = `http://localhost:3000/api/studentTest?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch test data: ${response.status} - ${errorText}`
        );
      }
      const data = await response.json();

      if (data.submitted) {
        alert(
          "You have already submitted your marks for this test. Please contact your faculty if you need to make changes."
        );
        return;
      }

      setTestData(data);
      setEntryStatus("Pending");
    } catch (error) {
      console.error("Error fetching test data:", error);
      setTestData(null);
      alert(
        "Failed to load test data. Please check your register number and try again."
      );
    }
  };

  // Handle marks entry
  const handleMarkChange = (
    questionId: string,
    questionNumber: string,
    value: string,
    maxMarks: number
  ) => {
    if (entryStatus === "Mark entry successfully updated") return;

    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    const sanitizedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');

    const numValue = sanitizedValue === '' ? 0 : parseFloat(sanitizedValue);
    const newMarks = { ...marks };
    const newExceed = { ...exceedMarks };

    if (sanitizedValue === '') {
      delete newMarks[questionNumber];
      delete newExceed[questionId];
    } else {
      newMarks[questionNumber] = numValue;
      newExceed[questionId] = numValue > maxMarks;
    }

    setMarks(newMarks);
    setExceedMarks(newExceed);
  };

  // Check if submit should be disabled
  const isSubmitDisabled = useMemo(() => {
    if (entryStatus === "Mark entry successfully updated") return true;
    if (!rollNumber || !testData) return true;

    const allQuestions = [...questions.partA, ...questions.partB];

    if (allQuestions.length === 0) return true;

    const hasExceededMarks = Object.values(exceedMarks).some((val) => val);

    return hasExceededMarks || Object.keys(marks).length === 0;
  }, [rollNumber, testData, marks, exceedMarks, entryStatus, questions]);

  // Handle mark submission
  const handleSubmitMarks = async () => {
    if (!testData || !testData.test) return;

    const newCoMarks = new Array(5).fill(0);
    [...questions.partA, ...questions.partB].forEach((q) => {
      const mark = marks[q.questionNumber] || 0;
      if (q.co >= 1 && q.co <= 5) {
        newCoMarks[q.co - 1] += mark;
      }
    });

    try {
      const response = await fetch(
        "http://localhost:3000/api/studentmarks/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId: testData.test.id,
            rollNumber: Number(rollNumber),
            coMarks: newCoMarks,
            questionMarks: marks,
            submitted: true,
          }),
        }
      );

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg);
      }

      setEntryStatus("Mark entry successfully updated");
      alert(
        "Marks submitted successfully! You cannot modify your marks after submission. Please contact your faculty if you need to make changes."
      );
    } catch (error) {
      console.error("Error updating student marks:", error);
      alert("Failed to submit marks. Please try again.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  // Update test data when loaded
  useEffect(() => {
    if (testData) {
      setQuestions({
        partA: testData.questions.partA || [],
        partB: testData.questions.partB || [],
      });

      const initialMarks: { [key: string]: number } = {};
      if (testData.questionMarks) {
        Object.entries(testData.questionMarks).forEach(([num, mark]) => {
          const question = [
            ...(testData.questions.partA || []),
            ...(testData.questions.partB || []),
          ].find((q) => q.questionNumber === num);
          if (question) {
            initialMarks[question.questionNumber] = Number(mark);
          }
        });
      }
      setMarks(initialMarks);

      setCoMarks(testData.coMarks || []);
      setIsSubmitted(testData.submitted || false);
      setStudentName(testData.studentName || "");
    }
  }, [testData]);

  return (
    <>
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
        /* Add these styles to prevent input field from changing while scrolling */
        input[type="text"] {
          font-variant-numeric: tabular-nums;
          text-align: left;
          font-feature-settings: "tnum";
        }
      `}</style>
      <div className="min-h-screen p-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">
                Student Dashboard
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {/* Selection Form */}
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

              {/* Subject Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a subject</option>
                  {semesterSubjectsFiltered.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubject && (
                <>
                  <div className="bg-gray-50 rounded-lg p-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-lg font-medium">Faculty Name</p>
                        <p className="text-gray-600">
                          {semesterSubjectsFiltered.find(
                            (s) => s.id === selectedSubject
                          )?.staffName || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
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

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Register Number
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="Enter your Register Number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleLoadTest}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Load Test
                    </button>
                  </div>
                </>
              )}

              {/* Questions Section */}
              {testData && (
                <div className="mt-8 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4">
                      <p className="text-lg font-medium">
                        Student Name: {testData.studentName}
                      </p>
                      <p className="text-gray-600">
                        Mark Entry Status: {entryStatus}
                      </p>
                      {entryStatus === "Mark entry successfully updated" && (
                        <p className="text-red-600 mt-2">
                          Note: You cannot modify your marks after submission.
                          Please contact your faculty if you need to make changes.
                        </p>
                      )}
                    </div>

                    {/* Part A Questions */}
                    <div className="space-y-4">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">
                        Part A Questions
                      </h4>
                      {questions.partA.map((question) => (
                        <div key={question.id} className="flex items-center gap-4">
                          <span className="text-gray-600 min-w-[120px]">
                            Question {question.questionNumber}:
                          </span>
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={marks[question.questionNumber] ?? ""}
                              onChange={(e) =>
                                handleMarkChange(
                                  question.id,
                                  question.questionNumber,
                                  e.target.value,
                                  question.maxMarks
                                )
                              }
                              onWheel={(e) => (e.target as HTMLInputElement).blur()} // Prevent scrolling to change value
                              disabled={entryStatus === "Mark entry successfully updated"}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${exceedMarks[question.id] ? "border-red-500 bg-red-50" : "border-gray-300"
                                }`}
                            />

                            {exceedMarks[question.id] && (
                              <span className="absolute top-[-10px] right-2 text-red-500 text-xs bg-white px-1 rounded">
                                Max: {question.maxMarks}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Part B Questions */}
                    <div className="space-y-4 mt-6">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">
                        Part B Questions
                      </h4>
                      {questions.partB.map((question) => (
                        <div key={question.id} className="flex items-center gap-4">
                          <span className="text-gray-600 min-w-[120px]">
                            Question {question.questionNumber}:
                          </span>
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={marks[question.questionNumber] || ""}
                              onChange={(e) =>
                                handleMarkChange(
                                  question.id,
                                  question.questionNumber,
                                  e.target.value,
                                  question.maxMarks
                                )
                              }
                              onWheel={(e) => (e.target as HTMLInputElement).blur()} // Prevent scrolling from changing values
                              disabled={entryStatus === "Mark entry successfully updated"}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${exceedMarks[question.id] ? "border-red-500 bg-red-50" : "border-gray-300"
                                }`}
                            />
                            {exceedMarks[question.id] && (
                              <span className="absolute top-[-10px] right-2 text-red-500 text-xs bg-white px-1 rounded">
                                Max: {question.maxMarks}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={handleSubmitMarks}
                        disabled={isSubmitDisabled}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <ClipboardList size={20} /> Submit Marks
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;