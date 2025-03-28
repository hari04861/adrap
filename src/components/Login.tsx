import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle2, Lock } from "lucide-react";
import { useStore } from "../store";

const Login = () => {
  const [selectedType, setSelectedType] = useState<
    "student" | "faculty" | "admin" | null
  >(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);

  // Validate faculty credentials using the correct API endpoint
  const validateFacultyCredentials = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      return data.isValid; // API returns { isValid: true/false }
    } catch (error) {
      console.error("Faculty login error:", error);
      return false;
    }
  };

  // Validate student credentials using the correct API endpoint
  const validateStudentCredentials = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error("Student login error:", error);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedType === "faculty") {
      if (await validateFacultyCredentials(username, password)) {
        setUser({ type: selectedType, username });
        navigate("/faculty");
      } else {
        setError("Invalid faculty credentials");
      }
    } else if (selectedType === "student") {
      if (await validateStudentCredentials(username, password)) {
        setUser({ type: selectedType, username });
        navigate("/student");
      } else {
        setError("Invalid student credentials");
      }
    } else if (selectedType === "admin") {
      // Admin credentials: username must be ADF01 or ADF05 and password must be 12345
      if (
        (username === "ADF01" || username === "ADF05") &&
        password === "12345"
      ) {
        setUser({ type: selectedType, username });
        navigate("/admin");
      } else {
        setError("Invalid admin credentials");
      }
    }
  };

  const handleTypeSelect = (type: "student" | "faculty" | "admin") => {
    setSelectedType(type);
    setUsername("");
    setPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img
            src="PSNA.png"
            alt="PSNA College Logo"
            className="w-40 h-40 mx-auto mb-4 rounded-full"
          />
          <h2 className="text-2xl font-semibold text-blue-800 mb-2">
            Department of Artificial Intelligence and Data Science
          </h2>
          <h1 className="text-3xl font-bold text-gray-800">Academic Portal</h1>
          <p className="text-gray-600 mt-2">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Box */}
          <div
            className={`bg-white rounded-2xl shadow-xl p-6 ${
              selectedType === "student" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="text-center mb-4">
              <UserCircle2 className="w-16 h-16 text-blue-600 mx-auto mb-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Student</h2>
            </div>
            <button
              onClick={() => handleTypeSelect("student")}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                selectedType === "student"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login as Student
            </button>
          </div>

          {/* Faculty Box */}
          <div
            className={`bg-white rounded-2xl shadow-xl p-6 ${
              selectedType === "faculty" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="text-center mb-4">
              <UserCircle2 className="w-16 h-16 text-green-600 mx-auto mb-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Faculty</h2>
            </div>
            <button
              onClick={() => handleTypeSelect("faculty")}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                selectedType === "faculty"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login as Faculty
            </button>
          </div>

          {/* Admin Box */}
          <div
            className={`bg-white rounded-2xl shadow-xl p-6 ${
              selectedType === "admin" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="text-center mb-4">
              <UserCircle2 className="w-16 h-16 text-purple-600 mx-auto mb-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Admin</h2>
            </div>
            <button
              onClick={() => handleTypeSelect("admin")}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                selectedType === "admin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login as Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        {selectedType && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}{" "}
              Login
            </h3>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>
                {selectedType === "admin" && (
                  <p className="mt-1 text-sm text-gray-500">
                  </p>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Sign In
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
