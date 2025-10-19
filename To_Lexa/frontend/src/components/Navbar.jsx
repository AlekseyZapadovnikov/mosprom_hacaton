import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Home, Briefcase, MessageSquare, BarChart3 } from 'lucide-react';

function Navbar({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav style={{
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="flex items-center gap-2">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--primary-color)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>
                Т
              </div>
              <div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '1.125rem',
                  color: 'var(--text-primary)'
                }}>
                  Карьерный центр
                </div>
                <div style={{ 
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  Технополис Москва
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-6" style={{ display: window.innerWidth > 768 ? 'flex' : 'none' }}>
            <Link to="/" className="flex items-center gap-2" style={{
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}>
              <Home size={18} />
              Главная
            </Link>
            
            <Link to="/vacancies" className="flex items-center gap-2" style={{
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}>
              <Briefcase size={18} />
              Вакансии
            </Link>

            {user && (
              <>
                <Link to="/chat" className="flex items-center gap-2" style={{
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                }}>
                  <MessageSquare size={18} />
                  Чат
                </Link>

                <Link to="/analytics" className="flex items-center gap-2" style={{
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                }}>
                  <BarChart3 size={18} />
                  Аналитика
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ display: window.innerWidth > 768 ? 'inline-flex' : 'none' }}>
                  <User size={16} />
                  {user.full_name}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  style={{ display: window.innerWidth > 768 ? 'inline-flex' : 'none' }}
                >
                  <LogOut size={16} />
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" style={{ display: window.innerWidth > 768 ? 'inline-flex' : 'none' }}>
                  Вход
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ display: window.innerWidth > 768 ? 'inline-flex' : 'none' }}>
                  Регистрация
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn btn-ghost btn-sm"
              style={{ display: window.innerWidth <= 768 ? 'inline-flex' : 'none' }}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2"
              style={{
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem'
              }}
            >
              <Home size={18} />
              Главная
            </Link>
            
            <Link 
              to="/vacancies"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2"
              style={{
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem'
              }}
            >
              <Briefcase size={18} />
              Вакансии
            </Link>

            {user && (
              <>
                <Link 
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem'
                  }}
                >
                  <User size={18} />
                  Личный кабинет
                </Link>

                <Link 
                  to="/chat"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem'
                  }}
                >
                  <MessageSquare size={18} />
                  Чат
                </Link>

                <Link 
                  to="/analytics"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem'
                  }}
                >
                  <BarChart3 size={18} />
                  Аналитика
                </Link>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={18} />
                  Выход
                </button>
              </>
            )}

            {!user && (
              <>
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%' }}
                >
                  Вход
                </Link>
                <Link 
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;