// --- Файл src/App.jsx (полная исправленная версия) ---

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Компоненты и страницы
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import VacanciesPage from './pages/VacanciesPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';

// ИЗМЕНЕНИЕ 1: Импортируем новый компонент дашборда для модератора
import ModeratorDashboard from './pages/ModeratorDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <RegisterPage onLogin={handleLogin} />} 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? (
                // ИЗМЕНЕНИЕ 2: Добавляем проверку для типа 'moderator'
                user.user_type === 'student' ? <StudentDashboard user={user} /> :
                user.user_type === 'company' ? <CompanyDashboard user={user} /> :
                user.user_type === 'university' ? <UniversityDashboard user={user} /> :
                user.user_type === 'moderator' ? <ModeratorDashboard user={user} /> : // <-- Вот эта строка
                <Navigate to="/" />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="/vacancies" element={<VacanciesPage user={user} />} />
          <Route 
            path="/chat" 
            element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/analytics" 
            element={user ? <AnalyticsPage user={user} /> : <Navigate to="/login" />} 
          />
          {/* Добавим универсальный редирект для несуществующих страниц */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;