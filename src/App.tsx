import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import StudentDashboard from './components/StudentDashboard';
import { useStore } from './store';

function App() {
  const user = useStore(state => state.user);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
        <Routes>
          <Route path="/" element={!user ? <Login /> : <Navigate to={`/${user.type}`} />} />
          <Route path="/admin" element={user?.type === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/faculty" element={user?.type === 'faculty' ? <StaffDashboard /> : <Navigate to="/" />} />
          <Route path="/student" element={user?.type === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;