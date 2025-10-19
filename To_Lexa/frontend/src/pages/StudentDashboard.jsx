import React, { useState, useEffect } from 'react';
import { User, FileText, Calendar, Briefcase, Plus, Edit, Save } from 'lucide-react';
import { studentsAPI, resumesAPI, appointmentsAPI, vacanciesAPI } from '../services/api';

function StudentDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [showEditResumeForm, setShowEditResumeForm] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState(null);

  const [profileForm, setProfileForm] = useState({
    university: '',
    major: '',
    graduation_year: new Date().getFullYear(),
    skills: [],
    bio: ''
  });

  const [resumeForm, setResumeForm] = useState({
    title: '',
    education: '',
    experience: '',
    skills: [],
    languages: [],
    achievements: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем профиль
      try {
        const profileRes = await studentsAPI.getProfile(user.id);
        setProfile(profileRes.data);
        setProfileForm({
          university: profileRes.data.university || '',
          major: profileRes.data.major || '',
          graduation_year: profileRes.data.graduation_year || new Date().getFullYear(),
          skills: profileRes.data.skills || [],
          bio: profileRes.data.bio || ''
        });
      } catch (err) {
        // Профиль не найден, создадим новый
        setProfile(null);
      }

      // Загружаем резюме
      try {
        const resumesRes = await resumesAPI.getByStudent(user.id);
        setResumes(resumesRes.data);
      } catch (err) {
        setResumes([]);
      }

      // Загружаем консультации
      try {
        const appointmentsRes = await appointmentsAPI.getByStudent(user.id);
        setAppointments(appointmentsRes.data);
      } catch (err) {
        setAppointments([]);
      }

      // Загружаем вакансии
      try {
        const vacanciesRes = await vacanciesAPI.getAll({ limit: 10 });
        setVacancies(vacanciesRes.data);
      } catch (err) {
        setVacancies([]);
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
        await studentsAPI.updateProfile(user.id, { ...profileForm, user_id: user.id });
      } else {
        await studentsAPI.createProfile({ ...profileForm, user_id: user.id });
      }
      setEditMode(false);
      loadData();
    } catch (error) {
      alert('Ошибка сохранения профиля');
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    try {
      await resumesAPI.create({ ...resumeForm, student_id: user.id });
      setShowResumeForm(false);
      setResumeForm({
        title: '',
        education: '',
        experience: '',
        skills: [],
        languages: [],
        achievements: ''
      });
      loadData();
    } catch (error) {
      alert('Ошибка создания резюме');
    }
  };

  const handleEditResumeClick = (resume) => {
    setEditingResumeId(resume.id);
    setResumeForm({
      title: resume.title,
      education: resume.education || '',
      experience: resume.experience || '',
      skills: resume.skills || [],
      languages: resume.languages || [],
      achievements: resume.achievements || ''
    });
    setShowEditResumeForm(true);
  };

  const handleEditResumeSubmit = async (e) => {
    e.preventDefault();
    try {
      await resumesAPI.updateResume(editingResumeId, resumeForm);
      setShowEditResumeForm(false);
      setEditingResumeId(null);
      setResumeForm({
        title: '',
        education: '',
        experience: '',
        skills: [],
        languages: [],
        achievements: ''
      });
      loadData();
    } catch (error) {
      alert('Ошибка обновления резюме');
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
          <h1 style={{ marginBottom: '0.5rem' }}>Личный кабинет студента</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Добро пожаловать, {user.full_name}!
          </p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Профиль
          </button>
          <button
            className={`tab ${activeTab === 'resumes' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumes')}
          >
            <FileText size={18} />
            Резюме
          </button>
          <button
            className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={18} />
            Консультации
          </button>
          <button
            className={`tab ${activeTab === 'vacancies' ? 'active' : ''}`}
            onClick={() => setActiveTab('vacancies')}
          >
            <Briefcase size={18} />
            Вакансии
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="card-title">Мой профиль</h3>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="btn btn-primary btn-sm">
                    <Edit size={16} />
                    Редактировать
                  </button>
                ) : (
                  <button onClick={handleProfileSave} className="btn btn-secondary btn-sm">
                    <Save size={16} />
                    Сохранить
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Университет</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.university}
                    onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                    disabled={!editMode}
                    placeholder="Название университета"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Специальность</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.major}
                    onChange={(e) => setProfileForm({ ...profileForm, major: e.target.value })}
                    disabled={!editMode}
                    placeholder="Ваша специальность"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Год выпуска</label>
                  <input
                    type="number"
                    className="form-input"
                    value={profileForm.graduation_year}
                    onChange={(e) => setProfileForm({ ...profileForm, graduation_year: parseInt(e.target.value) })}
                    disabled={!editMode}
                    min={2020}
                    max={2030}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Навыки (через запятую)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={Array.isArray(profileForm.skills) ? profileForm.skills.join(', ') : ''}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                    disabled={!editMode}
                    placeholder="Python, JavaScript, React"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">О себе</label>
                <textarea
                  className="form-textarea"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  disabled={!editMode}
                  placeholder="Расскажите о себе..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {/* Resumes Tab */}
        {activeTab === 'resumes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3>Мои резюме</h3>
              <button onClick={() => setShowResumeForm(true)} className="btn btn-primary">
                <Plus size={18} />
                Создать резюме
              </button>
            </div>

            {resumes.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <FileText size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                <h4>У вас пока нет резюме</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Создайте свое первое резюме, чтобы начать поиск работы
                </p>
                <button onClick={() => setShowResumeForm(true)} className="btn btn-primary">
                  <Plus size={18} />
                  Создать резюме
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {resumes.map((resume) => (
                  <div key={resume.id} className="card">
                    <h4 className="card-title">{resume.title}</h4>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {resume.education && <p><strong>Образование:</strong> {resume.education}</p>}
                      {resume.skills && resume.skills.length > 0 && (
                        <p><strong>Навыки:</strong> {resume.skills.join(', ')}</p>
                      )}
                    </div>
                    <div className="card-footer">
                      <button className="btn btn-outline btn-sm" onClick={() => handleEditResumeClick(resume)}>
                        Редактировать
                      </button>
                      <button className="btn btn-ghost btn-sm">Скачать PDF</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resume Create Modal */}
            {showResumeForm && (
              <div className="modal-overlay" onClick={() => setShowResumeForm(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Создать резюме</h3>
                  </div>
                  <form onSubmit={handleResumeSubmit}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label className="form-label">Название резюме</label>
                        <input
                          type="text"
                          className="form-input"
                          value={resumeForm.title}
                          onChange={(e) => setResumeForm({ ...resumeForm, title: e.target.value })}
                          required
                          placeholder="Frontend Developer"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Образование</label>
                        <textarea
                          className="form-textarea"
                          value={resumeForm.education}
                          onChange={(e) => setResumeForm({ ...resumeForm, education: e.target.value })}
                          placeholder="МГУ, Факультет ВМК, 2020-2024"
                          rows={3}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Опыт работы</label>
                        <textarea
                          className="form-textarea"
                          value={resumeForm.experience}
                          onChange={(e) => setResumeForm({ ...resumeForm, experience: e.target.value })}
                          placeholder="Опишите ваш опыт работы..."
                          rows={4}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Навыки (через запятую)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={Array.isArray(resumeForm.skills) ? resumeForm.skills.join(', ') : ''}
                          onChange={(e) => setResumeForm({ ...resumeForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                          placeholder="Python, JavaScript, React"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Языки (через запятую)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={Array.isArray(resumeForm.languages) ? resumeForm.languages.join(', ') : ''}
                          onChange={(e) => setResumeForm({ ...resumeForm, languages: e.target.value.split(',').map(s => s.trim()) })}
                          placeholder="Русский, Английский"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Достижения</label>
                        <textarea
                          className="form-textarea"
                          value={resumeForm.achievements}
                          onChange={(e) => setResumeForm({ ...resumeForm, achievements: e.target.value })}
                          placeholder="Ваши достижения и награды..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" onClick={() => setShowResumeForm(false)} className="btn btn-ghost">
                        Отмена
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Создать резюме
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Resume Edit Modal */}
            {showEditResumeForm && (
              <div className="modal-overlay" onClick={() => setShowEditResumeForm(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Редактировать резюме</h3>
                  </div>
                  <form onSubmit={handleEditResumeSubmit}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label className="form-label">Название резюме</label>
                        <input
                          type="text"
                          className="form-input"
                          value={resumeForm.title}
                          onChange={(e) => setResumeForm({ ...resumeForm, title: e.target.value })}
                          required
                          placeholder="Frontend Developer"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Образование</label>
                        <textarea
                          className="form-textarea"
                          value={resumeForm.education}
                          onChange={(e) => setResumeForm({ ...resumeForm, education: e.target.value })}
                          placeholder="МГУ, Факультет ВМК, 2020-2024"
                          rows={3}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Опыт работы</label>
                        <textarea
                          className="form-textarea"
                          value={resumeForm.experience}
                          onChange={(e) => setResumeForm({ ...resumeForm, experience: e.target.value })}
                          placeholder="Опишите ваш опыт работы..."
                          rows={4}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Навыки (через запятую)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={Array.isArray(resumeForm.skills) ? resumeForm.skills.join(', ') : ''}
                          onChange={(e) => setResumeForm({ ...resumeForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                          placeholder="Python, JavaScript, React"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Языки (через запятую)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={Array.isArray(resumeForm.languages) ? resumeForm.languages.join(', ') : ''}
                          onChange={(e) => setResumeForm({ ...resumeForm, languages: e.target.value.split(',').map(s => s.trim()) })}
                          placeholder="Русский, Английский"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Достижения</label>
                        <textarea
                          className="form-textarea"
                          value={resumeForm.achievements}
                          onChange={(e) => setResumeForm({ ...resumeForm, achievements: e.target.value })}
                          placeholder="Ваши достижения и награды..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" onClick={() => setShowEditResumeForm(false)} className="btn btn-ghost">
                        Отмена
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Сохранить изменения
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3>Мои консультации</h3>
              <button className="btn btn-primary">
                <Plus size={18} />
                Записаться на консультацию
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <Calendar size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                <h4>У вас нет запланированных консультаций</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Запишитесь на консультацию с HR-специалистом
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="card-title">{appointment.appointment_type === 'consultation' ? 'Консультация' : 'Собеседование'}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {new Date(appointment.appointment_date).toLocaleString('ru-RU')}
                        </p>
                        {appointment.notes && (
                          <p style={{ marginTop: '0.5rem' }}>{appointment.notes}</p>
                        )}
                      </div>
                      <span className="badge badge-primary">{appointment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vacancies Tab */}
        {activeTab === 'vacancies' && (
          <div>
            <h3 className="mb-4">Рекомендуемые вакансии</h3>

            {vacancies.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <Briefcase size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                <h4>Вакансии не найдены</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Попробуйте обновить страницу позже
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {vacancies.map((vacancy) => (
                  <div key={vacancy.id} className="card">
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <h4 className="card-title">{vacancy.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {vacancy.company_profiles?.company_name || 'Компания'}
                        </p>
                        <p style={{ marginBottom: '0.75rem' }}>{vacancy.description}</p>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          {vacancy.is_internship && <span className="badge badge-primary">Стажировка</span>}
                          <span className="badge badge-success">{vacancy.employment_type}</span>
                          {vacancy.location && <span className="badge">{vacancy.location}</span>}
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm">Откликнуться</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;