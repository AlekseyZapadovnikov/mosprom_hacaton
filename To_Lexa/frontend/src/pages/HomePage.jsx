import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, GraduationCap, MessageSquare, TrendingUp, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import AIChat from '../components/AIChat';

function HomePage({ user }) {
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 700, 
            marginBottom: '1.5rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Карьерный центр Технополис Москва
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            marginBottom: '2rem',
            maxWidth: '800px',
            margin: '0 auto 2rem',
            opacity: 0.95
          }}>
            Единая платформа для студентов, компаний и вузов. Находите вакансии, стажировки и развивайте карьеру в инновационной среде.
          </p>
          <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
            {!user && (
              <>
                <Link to="/register" className="btn btn-lg" style={{
                  backgroundColor: 'white',
                  color: '#667eea',
                  fontWeight: 600
                }}>
                  Начать работу
                  <ArrowRight size={20} />
                </Link>
                <Link to="/vacancies" className="btn btn-lg btn-outline" style={{
                  borderColor: 'white',
                  color: 'white'
                }}>
                  Смотреть вакансии
                </Link>
              </>
            )}
            {user && (
              <Link to="/dashboard" className="btn btn-lg" style={{
                backgroundColor: 'white',
                color: '#667eea',
                fontWeight: 600
              }}>
                Перейти в личный кабинет
                <ArrowRight size={20} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="text-center mb-6" style={{ fontSize: '2.5rem' }}>
            Возможности платформы
          </h2>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Для студентов */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--primary-color)'
              }}>
                <GraduationCap size={32} />
              </div>
              <h3 className="mb-3">Для студентов</h3>
              <ul style={{ 
                textAlign: 'left', 
                listStyle: 'none',
                padding: 0,
                color: 'var(--text-secondary)'
              }}>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Поиск вакансий и стажировок
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Конструктор резюме
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Запись на консультации
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Общение с работодателями
                </li>
              </ul>
            </div>

            {/* Для компаний */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--secondary-color)'
              }}>
                <Briefcase size={32} />
              </div>
              <h3 className="mb-3">Для компаний</h3>
              <ul style={{ 
                textAlign: 'left', 
                listStyle: 'none',
                padding: 0,
                color: 'var(--text-secondary)'
              }}>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Размещение вакансий
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Управление откликами
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Поиск талантов
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Аналитика подбора
                </li>
              </ul>
            </div>

            {/* Для вузов */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--accent-color)'
              }}>
                <Users size={32} />
              </div>
              <h3 className="mb-3">Для вузов</h3>
              <ul style={{ 
                textAlign: 'left', 
                listStyle: 'none',
                padding: 0,
                color: 'var(--text-secondary)'
              }}>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Мониторинг стажировок
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Рекомендации студентам
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Статистика трудоустройства
                </li>
                <li className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                  Связь с работодателями
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-8">
        <div className="container">
          <div className="card" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '3rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <Sparkles size={40} />
            </div>
            <h2 className="mb-3" style={{ fontSize: '2rem' }}>AI-помощник карьерного центра</h2>
            <p style={{ 
              fontSize: '1.125rem', 
              marginBottom: '2rem',
              opacity: 0.95,
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Умный чат-бот поможет вам найти нужную информацию, подскажет, как создать резюме, и направит к нужному разделу платформы.
            </p>
            <button 
              onClick={() => setShowAIChat(true)}
              className="btn btn-lg"
              style={{
                backgroundColor: 'white',
                color: '#667eea',
                fontWeight: 600
              }}
            >
              <MessageSquare size={20} />
              Открыть AI-чат
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="grid grid-cols-4 gap-6">
            <div className="card text-center">
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: 'var(--primary-color)',
                marginBottom: '0.5rem'
              }}>
                500+
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Студентов</div>
            </div>
            
            <div className="card text-center">
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: 'var(--secondary-color)',
                marginBottom: '0.5rem'
              }}>
                100+
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Компаний</div>
            </div>
            
            <div className="card text-center">
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: 'var(--accent-color)',
                marginBottom: '0.5rem'
              }}>
                250+
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Вакансий</div>
            </div>
            
            <div className="card text-center">
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: '#ef4444',
                marginBottom: '0.5rem'
              }}>
                50+
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Стажировок</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-8">
          <div className="container">
            <div className="card" style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <h2 className="mb-3" style={{ fontSize: '2rem' }}>
                Готовы начать свой карьерный путь?
              </h2>
              <p style={{ 
                fontSize: '1.125rem', 
                marginBottom: '2rem',
                opacity: 0.95
              }}>
                Присоединяйтесь к Карьерному центру Технополис Москва уже сегодня
              </p>
              <Link 
                to="/register" 
                className="btn btn-lg"
                style={{
                  backgroundColor: 'white',
                  color: '#f5576c',
                  fontWeight: 600
                }}
              >
                Зарегистрироваться бесплатно
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat user={user} onClose={() => setShowAIChat(false)} />
      )}
    </div>
  );
}

export default HomePage;