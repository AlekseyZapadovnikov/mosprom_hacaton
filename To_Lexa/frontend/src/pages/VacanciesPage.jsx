import React, { useState, useEffect } from 'react';
import { Search, Briefcase, MapPin, DollarSign, Filter } from 'lucide-react';
import { vacanciesAPI, resumesAPI } from '../services/api';

function VacanciesPage({ user }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    employment_type: '',
    is_internship: null
  });

  // Состояния для модального окна отклика
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [responseData, setResponseData] = useState({ resume_id: '', additional_info: '' });
  const [studentResumes, setStudentResumes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Для состояния загрузки при отправке

  useEffect(() => {
    loadVacancies();
  }, [filters]);

  // Загрузка резюме студента при монтировании
  useEffect(() => {
    const loadResumes = async () => {
      if (!user || user.user_type !== 'student') return;
      try {
        // ▼▼▼ ИСПРАВЛЕНИЕ №1: Имя функции было неверным ▼▼▼
        const res = await resumesAPI.getByStudent(user.id);
        const resumes = res.data || [];
        setStudentResumes(resumes);
        // Автоматически выбираем первое резюме в форме, если оно есть
        if (resumes.length > 0) {
          setResponseData(prev => ({ ...prev, resume_id: resumes[0].id }));
        }
      } catch (err) {
        console.error('Error loading student resumes:', err);
        setStudentResumes([]);
      }
    };

    loadResumes();
  }, [user]);

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.employment_type) params.employment_type = filters.employment_type;
      if (filters.is_internship !== null) params.is_internship = filters.is_internship;

      const response = await vacanciesAPI.getAll(params);
      setVacancies(response.data);
    } catch (error) {
      console.error('Error loading vacancies:', error);
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация вакансий на стороне клиента
  const filteredVacancies = vacancies.filter(vacancy =>
    vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vacancy.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Обработчик открытия модального окна
  const handleOpenResponseModal = (vacancyId) => {
    setSelectedVacancy(vacancyId);
    // Сбрасываем доп. информацию при открытии окна
    setResponseData(prev => ({...prev, additional_info: ''}));
    setShowResponseModal(true);
  };

  // Обработчик отправки отклика
  const handleSubmitResponse = async (evt) => {
    evt.preventDefault();
    if (!selectedVacancy || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await vacanciesAPI.createVacancyResponse({
        vacancy_id: selectedVacancy,
        student_id: user.id,
        resume_id: responseData.resume_id,
        additional_info: responseData.additional_info,
      });
      // Успешно! Закрываем окно и сбрасываем состояние
      setShowResponseModal(false);
      alert('Ваш отклик успешно отправлен!');
    } catch (err) {
      console.error('Error creating vacancy response:', err);
      alert('Не удалось отправить отклик. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6" style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Шапка страницы и фильтры (без изменений) */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Вакансии и стажировки</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Найдите идеальную работу или стажировку в Технополис Москва
          </p>
        </div>
        <div className="card mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="form-input" placeholder="Поиск по названию или описанию..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Тип занятости</label>
                <select className="form-select" value={filters.employment_type} onChange={e => setFilters({ ...filters, employment_type: e.target.value })}>
                  <option value="">Все типы</option>
                  <option value="full-time">Полная занятость</option>
                  <option value="part-time">Частичная занятость</option>
                  <option value="internship">Стажировка</option>
                  <option value="contract">Контракт</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Тип вакансии</label>
                <select className="form-select" value={filters.is_internship === null ? '' : filters.is_internship.toString()} onChange={e => setFilters({ ...filters, is_internship: e.target.value === '' ? null : e.target.value === 'true' })}>
                  <option value="">Все вакансии</option>
                  <option value="false">Только работа</option>
                  <option value="true">Только стажировки</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => { setFilters({ employment_type: '', is_internship: null }); setSearchQuery(''); }} className="btn btn-outline" style={{ width: '100%' }}>
                  <Filter size={18} /> Сбросить фильтры
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Отображение вакансий */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loading" style={{ margin: '0 auto' }}></div></div>
        ) : filteredVacancies.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <Briefcase size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
            <h4>Вакансии не найдены</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Найдено вакансий: <strong>{filteredVacancies.length}</strong></div>
            <div className="grid grid-cols-1 gap-4">
              {filteredVacancies.map((vacancy) => (
                <div key={vacancy.id} className="card">
                  <div className="flex justify-between items-start">
                    <div style={{ flex: 1 }}>
                      <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>{vacancy.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{vacancy.company_profiles?.company_name || 'Компания'}</p>
                      <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{vacancy.description}</p>
                      {vacancy.requirements && <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}><strong>Требования:</strong> {vacancy.requirements}</div>}
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {vacancy.is_internship && <span className="badge badge-primary"><Briefcase size={14} /> Стажировка</span>}
                        <span className="badge badge-success">{vacancy.employment_type}</span>
                        {vacancy.location && <span className="badge"><MapPin size={14} /> {vacancy.location}</span>}
                        {vacancy.salary_range && <span className="badge badge-warning"><DollarSign size={14} /> {vacancy.salary_range}</span>}
                      </div>
                    </div>
                    <div style={{ marginLeft: '1.5rem' }}>
                      {user && user.user_type === "student" ?
                        <button className="btn btn-primary" onClick={() => handleOpenResponseModal(vacancy.id)}>Откликнуться</button>
                      : <button className="btn btn-outline">Подробнее</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Модальное окно отклика */}
        {showResponseModal && (
          <div className="modal-overlay">
            <div className="modal">
              {/* ▼▼▼ ИСПРАВЛЕНИЕ №2: Форма теперь вызывает правильный обработчик ▼▼▼ */}
              <form onSubmit={handleSubmitResponse}>
                <div className="modal-header">
                  <h3 className="modal-title">Отклик на вакансию</h3>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Выберите резюме</label>
                    <select className="form-select" value={responseData.resume_id} onChange={e => setResponseData({...responseData, resume_id: e.target.value})} required>
                      {studentResumes.length === 0 ? (
                        <option value="" disabled>У вас нет созданных резюме</option>
                      ) : (
                        studentResumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Сопроводительное письмо (необязательно)</label>
                    <textarea className="form-textarea" value={responseData.additional_info} onChange={e => setResponseData({...responseData, additional_info: e.target.value})} placeholder="Почему вы подходите на эту вакансию?" rows={4} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowResponseModal(false)} disabled={isSubmitting}>Отмена</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || studentResumes.length === 0}>
                    {isSubmitting ? 'Отправка...' : 'Отправить отклик'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VacanciesPage;