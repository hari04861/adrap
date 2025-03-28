import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  BookOpen,
  LogOut,
  Save,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";

const AdminDashboard = () => {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState("2022-2026");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2023-2024");
  const [staffName, setStaffName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [showSaveAll, setShowSaveAll] = useState(false);

  type Subject = {
    id: string;
    code: string;
    name: string;
    semester: number;
    batch: string;
    section: string;
    staffName: string;
    username: string;
    password: string;
    studentUsername: string;
    studentPassword: string;
    academicYear: string;
  };

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [savedSelections, setSavedSelections] = useState<{
    batch: string;
    section: string;
    semester: number;
    academicYear: string;
  } | null>(null);

  // Load saved configuration from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("savedSelections");
    if (saved) {
      setSavedSelections(JSON.parse(saved));
    }
  }, []);

  // Fetch all subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/subjects");
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const data = await response.json();
        setSubjects(data);
        setShowSaveAll(data.length >= 1);
      } catch (error) {
        console.error("❌ Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, []);

  // Clear form inputs when dropdown selections change (but keep saved configuration)
  useEffect(() => {
    setSubjectName("");
    setSubjectCode("");
    setStaffName("");
    setUsername("");
    setPassword("");
    setStudentUsername("");
    setStudentPassword("");
    setShowSave(false);
  }, [selectedBatch, selectedSemester, selectedSection, selectedAcademicYear]);

  // Update batch and section settings via API when they change
  useEffect(() => {
    const updateBatchAndSection = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/settings/batchsection",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batch: selectedBatch,
              section: selectedSection,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to update batch & section");
        console.log("✅ Batch and section updated in MySQL");
      } catch (error) {
        console.error("❌ Error updating batch & section:", error);
      }
    };

    updateBatchAndSection();
  }, [selectedBatch, selectedSection]);

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

  const handleInputChange = (
    field:
      | "name"
      | "code"
      | "faculty"
      | "username"
      | "password"
      | "studentUsername"
      | "studentPassword",
    value: string
  ) => {
    switch (field) {
      case "name":
        setSubjectName(value);
        break;
      case "code":
        setSubjectCode(value);
        break;
      case "faculty":
        setStaffName(value);
        break;
      case "username":
        setUsername(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "studentUsername":
        setStudentUsername(value);
        break;
      case "studentPassword":
        setStudentPassword(value);
        break;
    }
    setShowSave(true);
  };

  // Add a new subject and update state immediately so it appears in the UI
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      subjectName.trim() &&
      subjectCode.trim() &&
      staffName.trim() &&
      username.trim() &&
      password.trim() &&
      studentUsername.trim() &&
      studentPassword.trim()
    ) {
      // Check for duplicate subject code and subject name combination
      const duplicate = subjects.find(
        (subject) =>
          subject.code === subjectCode && subject.name === subjectName
      );
      if (duplicate) {
        alert(
          "Subject with the same code and name already exists. Please use different values."
        );
        return;
      }

      try {
        const newSubject: Subject = {
          id: `${Date.now()}-${selectedSection}`,
          name: subjectName,
          code: subjectCode,
          semester: selectedSemester,
          batch: selectedBatch,
          section: selectedSection,
          staffName: staffName,
          username: username,
          password: password,
          studentUsername: studentUsername,
          studentPassword: studentPassword,
          academicYear: selectedAcademicYear,
        };

        const response = await fetch("http://localhost:3000/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSubject),
        });

        if (!response.ok) throw new Error("Failed to add subject");

        alert("✅ Subject added successfully!");

        // Save current configuration and persist to localStorage
        const currentConfig = {
          batch: selectedBatch,
          section: selectedSection,
          semester: selectedSemester,
          academicYear: selectedAcademicYear,
        };
        setSavedSelections(currentConfig);
        localStorage.setItem("savedSelections", JSON.stringify(currentConfig));

        // Immediately update subjects state to include new subject
        setSubjects((prev) => [...prev, newSubject]);

        // Clear form fields after successful save
        setSubjectName("");
        setSubjectCode("");
        setStaffName("");
        setUsername("");
        setPassword("");
        setStudentUsername("");
        setStudentPassword("");
        setShowSave(false);
      } catch (error) {
        console.error("❌ Error adding subject:", error);
        alert("⚠️ Server error while adding subject.");
      }
    }
  };

  // Delete subject and update state immediately
  const handleDeleteSubject = async (subjectToDelete: {
    code: string;
    name: string;
  }) => {
    try {
      const subjectToRemove = subjects.find(
        (subject) =>
          subject.code === subjectToDelete.code &&
          subject.name === subjectToDelete.name &&
          subject.semester === selectedSemester &&
          subject.batch === selectedBatch &&
          subject.section === selectedSection &&
          subject.academicYear === selectedAcademicYear
      );

      if (!subjectToRemove) {
        alert("❌ Subject not found!");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/subjects/${subjectToRemove.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete subject");

      alert("✅ Subject deleted successfully!");
      const updatedSubjects = subjects.filter(
        (subject) => subject.id !== subjectToRemove.id
      );
      setSubjects(updatedSubjects);
    } catch (error) {
      console.error("❌ Error deleting subject:", error);
      alert("⚠️ Server error while deleting subject.");
    }
  };

  const handleResetSubjects = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all subjects? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(
          "http://localhost:3000/api/subjects/reset",
          {
            method: "POST",
          }
        );

        if (!response.ok) throw new Error("Failed to reset subjects");

        alert("✅ All subjects have been reset successfully!");
        setSavedSelections(null);
        localStorage.removeItem("savedSelections");
        setSubjects([]);
      } catch (error) {
        console.error("❌ Error resetting subjects:", error);
        alert("⚠️ Server error while resetting subjects.");
      }
    }
  };

  const handleSaveAllSubjects = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subjects),
      });

      if (response.ok) {
        alert("✅ Subjects saved to database!");
      } else {
        alert("❌ Failed to save subjects!");
      }
    } catch (error) {
      console.error("❌ Error saving subjects:", error);
      alert("⚠️ Server error while saving subjects.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Compute unique subjects based on current filters
  const [uniqueSubjects, setUniqueSubjects] = useState<
    Array<{
      code: string;
      name: string;
      staffName: string;
      username: string;
      studentUsername: string;
    }>
  >([]);

  useEffect(() => {
    const filtered = subjects.filter(
      (subject) =>
        subject.semester === selectedSemester &&
        subject.batch === selectedBatch &&
        subject.section === selectedSection &&
        subject.academicYear === selectedAcademicYear
    );

    const unique = filtered.reduce((acc: any[], currentSubject: any) => {
      const key = `${currentSubject.code}-${currentSubject.name}`;
      if (!acc.some((s) => `${s.code}-${s.name}` === key)) {
        acc.push({
          code: currentSubject.code,
          name: currentSubject.name,
          staffName: currentSubject.staffName,
          username: currentSubject.username,
          studentUsername: currentSubject.studentUsername,
        });
      }
      return acc;
    }, []);

    setUniqueSubjects(unique);
  }, [
    subjects,
    selectedSemester,
    selectedBatch,
    selectedSection,
    selectedAcademicYear,
  ]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleResetSubjects}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <RefreshCw size={20} />
              Reset All
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {savedSelections && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Last Saved Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="font-medium">{savedSelections.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch</p>
                  <p className="font-medium">{savedSelections.batch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Section</p>
                  <p className="font-medium">
                    Section {savedSelections.section}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Semester</p>
                  <p className="font-medium">
                    Semester {savedSelections.semester}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleAddSubject} className="mb-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="Enter subject code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => handleInputChange("faculty", e.target.value)}
                  placeholder="Enter faculty name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="Enter faculty username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter faculty password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={studentUsername}
                  onChange={(e) =>
                    handleInputChange("studentUsername", e.target.value)
                  }
                  placeholder="Enter student username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) =>
                    handleInputChange("studentPassword", e.target.value)
                  }
                  placeholder="Enter student password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter subject name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSave &&
                  staffName.trim() &&
                  username.trim() &&
                  password.trim() &&
                  studentUsername.trim() &&
                  studentPassword.trim() ? (
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={20} />
                    Add Subject
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 bg-gray-200 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed"
                  >
                    <PlusCircle size={20} />
                    Add Subject
                  </button>
                )}
              </div>
            </div>
          </form>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Subjects for {selectedBatch} - Section {selectedSection} -
                Semester {selectedSemester} - {selectedAcademicYear}
              </h2>
            </div>
            <div className="grid gap-4">
              {uniqueSubjects.map((subject) => (
                <div
                  key={`${subject.code}-${subject.name}`}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {subject.code}
                      </span>
                      <span>{subject.name}</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-600">
                        Faculty: {subject.staffName}
                      </span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-600">
                        Faculty Username: {subject.username}
                      </span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-600">
                        Student Username: {subject.studentUsername}
                      </span>
                      <Check size={16} className="text-green-500" />
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(subject)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
