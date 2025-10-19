import React, { useState, useEffect } from 'react';
import { Building, Briefcase, Users, TrendingUp } from 'lucide-react';
import { universitiesAPI, vacanciesAPI } from '../services/api';

function UniversityDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [profileForm, setProfileForm] = useState({
    university_name: '',
    description: '',
    website: '',
    contact_email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const profileRes = await universitiesAPI.getProfile(user.id);
        setProfile(profileRes.data);
        setProfileForm({
          university_name: profileRes.data.university_name || '',
          description: profileRes.data.description || '',
          website: profileRes.data.website || '',
          contact_email: profileRes.data.contact_email || ''
        });
      } catch (err) {
        setProfile(null);
      }

      // Загружаем стажировки
      try {
        const vacanciesRes = await vacanciesAPI.getAll({ is_internship: true });
        setInternships(vacanciesRes.data);
      } catch (err) {
        setInternships([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      if (profile) {
        await universitiesAPI.updateProfile(user.id, { ...profileForm, user_id: user.id });
      } else {
        await universitiesAPI.createProfile({ ...profileForm, user_id: user.id });
      }
      setEditMode(false);
      loadData();
    } catch (error) {
      alert('Ошибка сохранения профиля');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="py-6" style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Личный кабинет вуза</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Добро пожаловать, {user.full_name}!
          </p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Building size={18} />
            Профиль вуза
          </button>
          <button
            className={`tab ${activeTab === 'internships' ? 'active' : ''}`}
            onClick={() => setActiveTab('internships')}
          >
            <Briefcase size={18} />
            Стажировки
          </button>
          <button
            className={`tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={18} />
            Студенты
          </button>
          <button
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} />
            Статистика
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="card-title">Профиль вуза</h3>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="btn btn-primary btn-sm">
                    Редактировать
                  </button>
                ) : (
                  <button onClick={handleProfileSave} className="btn btn-secondary btn-sm">
                    Сохранить
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Название вуза</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.university_name}
                    onChange={(e) => setProfileForm({ ...profileForm, university_name: e.target.value })}
                    disabled={!editMode}
                    placeholder="МГУ им. М.В. Ломоносова"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Контактный email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileForm.contact_email}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                    disabled={!editMode}
                    placeholder="career@university.ru"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Веб-сайт</label>
                  <input
                    type="url"
                    className="form-input"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    disabled={!editMode}
                    placeholder="https://university.ru"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-textarea"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  disabled={!editMode}
                  placeholder="Расскажите о вашем вузе..."
                  rows={6}
                />
              </div>
            </div>
          </div>
        )}

        {/* Internships Tab */}
        {activeTab === 'internships' && (
          <div>
            <h3 className="mb-4">Доступные стажировки</h3>
            
            {internships.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <Briefcase size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                <h4>Стажировки не найдены</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Новые стажировки появятся здесь автоматически
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {internships.map((internship) => (
                  <div key={internship.id} className="card">
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <h4 className="card-title">{internship.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {internship.company_profiles?.company_name || 'Компания'}
                        </p>
                        <p style={{ marginBottom: '0.75rem' }}>{internship.description}</p>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
                          <span className="badge badge-primary">Стажировка</span>
                          <span className="badge badge-success">{internship.employment_type}</span>
                          {internship.location && <span className="badge">{internship.location}</span>}
                          {internship.salary_range && <span className="badge badge-warning">{internship.salary_range}</span>}
                        </div>
                        {internship.requirements && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Требования:</strong> {internship.requirements}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm">Рекомендовать студентам</button>
                        <button className="btn btn-outline btn-sm">Подробнее</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
            <h4>Управление студентами</h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Здесь будет отображаться информация о студентах вашего вуза
            </p>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h3 className="mb-4">Статистика трудоустройства</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card text-center">
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--primary-color)',
                  marginBottom: '0.5rem'
                }}>
                  0
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Студентов на платформе</div>
              </div>
              
              <div className="card text-center">
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--secondary-color)',
                  marginBottom: '0.5rem'
                }}>
                  {internships.length}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Доступных стажировок</div>
              </div>
              
              <div className="card text-center">
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--accent-color)',
                  marginBottom: '0.5rem'
                }}>
                  0
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Трудоустроено</div>
              </div>
            </div>

            <div className="card">
              <h4 className="card-title">Аналитика по трудоустройству</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Детальная статистика появится после регистрации студентов и их трудоустройства
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UniversityDashboard;