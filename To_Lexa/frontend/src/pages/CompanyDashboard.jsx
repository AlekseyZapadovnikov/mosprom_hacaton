import React, { useState, useEffect } from 'react';
import {
    Briefcase, User, Search as SearchIcon, Plus, Building,
    GraduationCap, ArrowLeft, Star, Target, BrainCircuit, Loader2
} from 'lucide-react';
import { candidatesAPI, vacanciesAPI } from '../services/api';
import axios from 'axios';

const companyAPI = {
    getProfile: (id) => axios.get(`/api/companies/profile/${id}`),
    updateProfile: (id, data) => axios.put(`/api/companies/profile/${id}`, data),
    createProfile: (data) => axios.post('/api/companies/profile', data),
    getCompanyResponses: () => axios.get('/api/vacancy_responses/company'),
};

function CompanyDashboard({ user }) {
    const [tab, setTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        company_name: '', industry: '', description: '', website: '', size: ''
    });

    // Состояния для откликов
    const [responses, setResponses] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);

    // Состояния для детального просмотра вакансии
    const [selectedVacancyId, setSelectedVacancyId] = useState(null);
    const [selectedVacancyData, setSelectedVacancyData] = useState(null);
    const [isVacancyDetailLoading, setIsVacancyDetailLoading] = useState(false);

    // Состояние для модального окна резюме
    const [viewingResume, setViewingResume] = useState(null);

    // Состояния для создания вакансии
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newVacancy, setNewVacancy] = useState({
        title: '', description: '', requirements: '', salary_range: '',
        location: '', employment_type: 'full-time', is_internship: false
    });

    // Состояния для поиска кандидатов
    const [searchParams, setSearchParams] = useState({
        skills: '', major: '', university: '', grad_year_from: null, grad_year_to: null
    });
    const [candidates, setCandidates] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);

    // Фильтры по рейтингам
    const [filterMotivation, setFilterMotivation] = useState(null);
    const [filterCriteria, setFilterCriteria] = useState(null);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profResult, vacsResult] = await Promise.allSettled([
                companyAPI.getProfile(user.id),
                vacanciesAPI.getMyCompanyVacancies()
            ]);

            if (profResult.status === 'fulfilled') {
                const prof = profResult.value;
                setProfile(prof.data);
                setProfileData({
                    company_name: prof.data.company_name || '',
                    industry: prof.data.industry || '',
                    description: prof.data.description || '',
                    website: prof.data.website || '',
                    size: prof.data.size || ''
                });
            } else {
                setProfile(null);
                console.error("Error fetching profile:", profResult.reason);
            }

            if (vacsResult.status === 'fulfilled') {
                setVacancies(vacsResult.value.data || []);
            } else {
                setVacancies([]);
                console.error("Error fetching vacancies:", vacsResult.reason);
            }
        } catch (err) {
            console.error('Error loading company data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadResponses = async () => {
        setResponsesLoading(true);
        try {
            const res = await companyAPI.getCompanyResponses();
            setResponses(res.data || []);
        } catch (err) {
            console.error('Error loading responses:', err);
            setResponses([]);
        } finally {
            setResponsesLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'responses') {
            loadResponses();
        }
    }, [tab]);

    const handleViewResponses = async (vacancyId) => {
        setSelectedVacancyId(vacancyId);
        setIsVacancyDetailLoading(true);
        setSelectedVacancyData(null);
        try {
            const res = await vacanciesAPI.getVacancyWithResponses(vacancyId);
            const data = res?.data ?? null;
            if (data && !Array.isArray(data.vacancy_touch)) {
                data.vacancy_touch = [];
            }
            setSelectedVacancyData(data);
        } catch (error) {
            console.error(`Error fetching vacancy ${vacancyId} with responses:`, error);
        } finally {
            setIsVacancyDetailLoading(false);
        }
    };

    const handleBackToVacancies = () => {
        setSelectedVacancyId(null);
        setSelectedVacancyData(null);
    };

    const handleCreateVacancy = async (e) => {
        e.preventDefault();
        try {
            await vacanciesAPI.create({ ...newVacancy, company_id: user.id });
            setShowCreateModal(false);
            setNewVacancy({
                title: '', description: '', requirements: '', salary_range: '',
                location: '', employment_type: 'full-time', is_internship: false
            });
            loadData();
        } catch (err) {
            console.error('Error creating vacancy:', err);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            if (profile) {
                await companyAPI.updateProfile(user.id, { ...profileData, user_id: user.id });
            } else {
                await companyAPI.createProfile({ ...profileData, user_id: user.id });
            }
            setEditing(false);
            loadData();
        } catch (err) {
            console.error('Error saving profile:', err);
        }
    };

    const handleSearchCandidates = async (e) => {
        e.preventDefault();
        setSearching(true);
        setSearched(true);
        try {
            const res = await candidatesAPI.search(searchParams);
            setCandidates(res.data || []);
        } catch (err) {
            console.error('Error searching candidates:', err);
            setCandidates([]);
        } finally {
            setSearching(false);
        }
    };

    const handleGenerateAllSummaries = async () => {
        if (!selectedVacancyData?.vacancy_touch?.length) {
            alert('Нет откликов для анализа.');
            return;
        }
        if (!confirm('Сгенерировать AI-анализ для всех откликов этой вакансии?')) return;

        setIsGeneratingAll(true);
        try {
            for (const touch of selectedVacancyData.vacancy_touch) {
                await vacanciesAPI.generateAISummary(touch.id);
            }
            alert('Анализ успешно сгенерирован для всех откликов!');
            await handleViewResponses(selectedVacancyId); // перезагрузим данные
        } catch (err) {
            console.error(err);
            alert('Ошибка при генерации анализа');
        } finally {
            setIsGeneratingAll(false);
        }
    };

    if (loading) {
        return <div className="loading-overlay"><div className="loading"></div></div>;
    }

    const renderVacancyDetail = () => {
        if (isVacancyDetailLoading) {
            return <div className="text-center p-8"><div className="loading mx-auto"></div></div>;
        }

        if (!selectedVacancyData) {
            return (
                <div className="card text-center p-8">
                    <button onClick={handleBackToVacancies} className="btn btn-ghost mb-4">
                        <ArrowLeft size={16} /> Назад
                    </button>
                    <h4>Не удалось загрузить данные вакансии.</h4>
                </div>
            );
        }

        const responsesArr = Array.isArray(selectedVacancyData.vacancy_touch) ? selectedVacancyData.vacancy_touch : [];

        // фильтрация по рейтингу
        const filteredResponses = responsesArr.filter((r) => {
            const motivation = Number(r.motivation_rating ?? r.motivation_score ?? 0);
            const meets = Number(r.meets_criteria_rating ?? r.meets_creteria_rating ?? 0);
            const passMotivation = !filterMotivation || motivation >= filterMotivation;
            const passCriteria = !filterCriteria || meets >= filterCriteria;
            return passMotivation && passCriteria;
        });

        return (
            <div>
                <button onClick={handleBackToVacancies} className="btn btn-ghost mb-4 flex items-center gap-2">
                    <ArrowLeft size={16} /> Назад к списку вакансий
                </button>

                <div className="card mb-4">
                    <div className="card-body">
                        <h3 className="card-title">{selectedVacancyData.title}</h3>
                        <p>{selectedVacancyData.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {selectedVacancyData.is_internship && <span className="badge badge-primary">Стажировка</span>}
                            <span className="badge badge-success">{selectedVacancyData.employment_type}</span>
                            {selectedVacancyData.location && <span className="badge">{selectedVacancyData.location}</span>}
                            {selectedVacancyData.salary_range && <span className="badge badge-warning">{selectedVacancyData.salary_range}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h4>Отклики ({responsesArr.length})</h4>
                    <button
                        onClick={handleGenerateAllSummaries}
                        disabled={isGeneratingAll}
                        className="btn btn-outline btn-sm flex items-center gap-2"
                    >
                        {isGeneratingAll ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                        {isGeneratingAll ? 'Генерация...' : 'Сгенерировать AI-саммари для всех'}
                    </button>
                </div>

                <div className="flex gap-4 mb-4 flex-wrap">
                    <div>
                        <label className="form-label">Мин. мотивация</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="0–100"
                            value={filterMotivation ?? ''}
                            onChange={(e) => setFilterMotivation(e.target.value ? Number(e.target.value) : null)}
                            style={{ width: '100px' }}
                        />
                    </div>
                    <div>
                        <label className="form-label">Мин. соответствие</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="0–100"
                            value={filterCriteria ?? ''}
                            onChange={(e) => setFilterCriteria(e.target.value ? Number(e.target.value) : null)}
                            style={{ width: '100px' }}
                        />
                    </div>
                </div>

                {filteredResponses.length === 0 ? (
                    <div className="card text-center p-8">
                        <GraduationCap size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                        <h4>Отклики не найдены (по фильтрам)</h4>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredResponses.map((r) => {
                            const motivationNum = Number(r.motivation_rating ?? r.motivation_score ?? 0);
                            const meetsNum = Number(r.meets_criteria_rating ?? r.meets_creteria_rating ?? 0);
                            const aiSummary = r.ai_summary ?? r.ai_summery ?? '';

                            return (
                                <div key={r.id} className="card">
                                    <div className="card-body">
                                        <p><strong>Студент:</strong> {r.student_profiles?.users?.full_name ?? '—'} ({r.student_profiles?.users?.email ?? '—'})</p>
                                        <p>
                                            <strong>Резюме: </strong>
                                            {r.resumes ? (
                                                <button className="link-button" onClick={() => setViewingResume(r.resumes)}>
                                                    {r.resumes.title || 'Просмотреть резюме'}
                                                </button>
                                            ) : ('Без резюме')}
                                        </p>
                                        <p><strong>Дополнительная информация:</strong> {r.additional_info ?? '—'}</p>
                                        <p><strong>Статус:</strong> <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'accepted' ? 'badge-success' : 'badge-error'}`}>{r.status}</span></p>

                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BrainCircuit size={18} className="text-indigo-500" />
                                                <h5 className="font-semibold text-sm m-0">AI Анализ</h5>
                                            </div>
                                            <p className="text-sm text-secondary italic">
                                                {aiSummary || 'Анализ еще не сгенерирован.'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t" style={{ fontSize: '0.875rem' }}>
                                            <div className="flex items-center gap-2">
                                                <Star size={16} className="text-yellow-500" />
                                                <strong>Мотивация:</strong>
                                                <span className="font-semibold">{motivationNum || '—'}/100</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Target size={16} className="text-green-500" />
                                                <strong>Соответствие:</strong>
                                                <span className="font-semibold">{meetsNum || '—'}/100</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <button className="btn btn-success btn-sm">Принять</button>
                                            <button className="btn btn-error btn-sm">Отклонить</button>
                                            <button className="btn btn-outline btn-sm">Связаться</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="py-6" style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)' }}>
            <div className="container">
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Личный кабинет компании</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Добро пожаловать, {user?.full_name ?? 'пользователь'}!</p>
                </div>

                <div className="tabs">
                    <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                        <Building size={18} /> Профиль компании
                    </button>
                    <button className={`tab ${tab === 'vacancies' ? 'active' : ''}`} onClick={() => { setTab('vacancies'); handleBackToVacancies(); }}>
                        <Briefcase size={18} /> Вакансии
                    </button>
                    <button className={`tab ${tab === 'candidates' ? 'active' : ''}`} onClick={() => setTab('candidates')}>
                        <SearchIcon size={18} /> Поиск кандидатов
                    </button>
                    <button className={`tab ${tab === 'responses' ? 'active' : ''}`} onClick={() => setTab('responses')}>
                        <GraduationCap size={18} /> Отклики
                    </button>
                </div>

                {tab === 'profile' && (
                    <div className="card">
                        <div className="card-header">
                            <div className="flex justify-between items-center">
                                <h3 className="card-title">Профиль компании</h3>
                                {editing ? (
                                    <button onClick={handleUpdateProfile} className="btn btn-secondary btn-sm">Сохранить</button>
                                ) : (
                                    <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm">Редактировать</button>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Название компании</label>
                                    <input type="text" className="form-input" value={profileData.company_name} onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })} disabled={!editing} placeholder="Название компании" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Отрасль</label>
                                    <input type="text" className="form-input" value={profileData.industry} onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })} disabled={!editing} placeholder="IT, Финансы и т.д." />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Веб-сайт</label>
                                <input type="url" className="form-input" value={profileData.website} onChange={(e) => setProfileData({ ...profileData, website: e.target.value })} disabled={!editing} placeholder="https://example.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Размер компании</label>
                                <select className="form-select" value={profileData.size} onChange={(e) => setProfileData({ ...profileData, size: e.target.value })} disabled={!editing}>
                                    <option value="">Выберите размер</option>
                                    <option value="1-10">1-10 сотрудников</option>
                                    <option value="11-50">11-50 сотрудников</option>
                                    <option value="51-200">51-200 сотрудников</option>
                                    <option value="201-500">201-500 сотрудников</option>
                                    <option value="500+">500+ сотрудников</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Описание компании</label>
                                <textarea className="form-textarea" value={profileData.description} onChange={(e) => setProfileData({ ...profileData, description: e.target.value })} disabled={!editing} placeholder="Расскажите о вашей компании..." rows={6} />
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'vacancies' && (
                    <div>
                        {selectedVacancyId ? renderVacancyDetail() : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3>Наши вакансии</h3>
                                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                                        <Plus size={18} /> Создать вакансию
                                    </button>
                                </div>
                                {vacancies.length === 0 ? (
                                    <div className="card text-center" style={{ padding: '3rem' }}>
                                        <Briefcase size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                                        <h4>У вас пока нет вакансий</h4>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                            Создайте первую вакансию, чтобы начать поиск сотрудников
                                        </p>
                                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                                            <Plus size={18} /> Создать вакансию
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {vacancies.map((v) => (
                                            <div key={v.id} className="card">
                                                <div className="flex justify-between items-start">
                                                    <div style={{ flex: 1, marginRight: '1rem' }}>
                                                        <h4 className="card-title">{v.title}</h4>
                                                        <p style={{ marginBottom: '0.75rem' }}>{v.description}</p>
                                                        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
                                                            {v.is_internship && <span className="badge badge-primary">Стажировка</span>}
                                                            <span className="badge badge-success">{v.employment_type}</span>
                                                            {v.location && <span className="badge">{v.location}</span>}
                                                            {v.salary_range && <span className="badge badge-warning">{v.salary_range}</span>}
                                                            <span className={`badge ${v.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                                                                {v.status}
                                                            </span>
                                                        </div>
                                                        {v.requirements && (
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                                <strong>Требования:</strong> {v.requirements}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col md:flex-row gap-2 items-stretch">
                                                        <button className="btn btn-outline btn-sm">Редактировать</button>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleViewResponses(v.id)}
                                                        >
                                                            Отклики ({v.response_count ?? v.responses_count ?? 0})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {showCreateModal && (
                            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                                <div className="modal" onClick={(e) => e.stopPropagation()}>
                                    <form onSubmit={handleCreateVacancy}>
                                        <div className="modal-header"><h3 className="modal-title">Создать вакансию</h3></div>
                                        <div className="modal-body">
                                            <div className="form-group">
                                                <label className="form-label">Название вакансии</label>
                                                <input type="text" className="form-input" value={newVacancy.title} onChange={(e) => setNewVacancy({ ...newVacancy, title: e.target.value })} required placeholder="Senior Frontend Developer" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Описание</label>
                                                <textarea className="form-textarea" value={newVacancy.description} onChange={(e) => setNewVacancy({ ...newVacancy, description: e.target.value })} required placeholder="Описание вакансии..." rows={4} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Требования</label>
                                                <textarea className="form-textarea" value={newVacancy.requirements} onChange={(e) => setNewVacancy({ ...newVacancy, requirements: e.target.value })} placeholder="Требования к кандидату..." rows={3} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group"><label className="form-label">Зарплатная вилка</label><input type="text" className="form-input" value={newVacancy.salary_range} onChange={(e) => setNewVacancy({ ...newVacancy, salary_range: e.target.value })} placeholder="100 000 - 150 000 ₽" /></div>
                                                <div className="form-group"><label className="form-label">Локация</label><input type="text" className="form-input" value={newVacancy.location} onChange={(e) => setNewVacancy({ ...newVacancy, location: e.target.value })} placeholder="Москва, удаленно" /></div>
                                            </div>
                                            <div className="form-group"><label className="form-label">Тип занятости</label><select className="form-select" value={newVacancy.employment_type} onChange={(e) => setNewVacancy({ ...newVacancy, employment_type: e.target.value })}><option value="full-time">Полная занятость</option><option value="part-time">Частичная занятость</option><option value="internship">Стажировка</option><option value="contract">Контракт</option></select></div>
                                            <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><input type="checkbox" checked={newVacancy.is_internship} onChange={(e) => setNewVacancy({ ...newVacancy, is_internship: e.target.checked })} /><span className="form-label" style={{ margin: 0 }}>Это стажировка</span></label><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Стажировки автоматически рассылаются вузам</p></div>
                                        </div>
                                        <div className="modal-footer"><button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Отмена</button><button type="submit" className="btn btn-primary">Создать вакансию</button></div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'candidates' && (
                    <div>
                        <div className="card mb-4">
                            <div className="card-body">
                                <form onSubmit={handleSearchCandidates} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="form-group"><label className="form-label">Навыки (через запятую)</label><input type="text" className="form-input" placeholder="Python, React, SQL" value={searchParams.skills} onChange={(e) => setSearchParams({ ...searchParams, skills: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Университет</label><input type="text" className="form-input" placeholder="МГТУ им. Баумана" value={searchParams.university} onChange={(e) => setSearchParams({ ...searchParams, university: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Специальность</label><input type="text" className="form-input" placeholder="Прикладная информатика" value={searchParams.major} onChange={(e) => setSearchParams({ ...searchParams, major: e.target.value })} /></div>
                                    <button type="submit" className="btn btn-primary w-full md:w-auto"><SearchIcon size={18} /> Найти</button>
                                </form>
                            </div>
                        </div>
                        {searching ? (
                            <div className="text-center p-8"><div className="loading mx-auto"></div></div>
                        ) : searched ? (
                            candidates.length === 0 ? (
                                <div className="card text-center" style={{ padding: '3rem' }}>
                                    <h4>Кандидаты не найдены</h4>
                                    <p style={{ color: 'var(--text-secondary)' }}>Попробуйте изменить критерии поиска.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {candidates.map((c) => (
                                        <div key={c.id} className="card">
                                            <div className="card-body">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="card-title">{c.users?.full_name ?? 'Имя'}</h4>
                                                        <p className="text-sm text-secondary mb-2">{c.major || 'Специальность не указана'}</p>
                                                    </div>
                                                    {(c.my_company_responses?.length ?? 0) > 0 && <span className="badge badge-success">✅ Откликался</span>}
                                                </div>
                                                <p className="mb-2"><strong>ВУЗ:</strong> {c.university || 'Не указан'}</p>
                                                {c.skills && c.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {c.skills.map((skill) => <span key={skill} className="badge">{skill}</span>)}
                                                    </div>
                                                )}
                                                <button className="btn btn-outline btn-sm w-full">Смотреть полный профиль</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="card text-center" style={{ padding: '3rem' }}>
                                <User size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                                <h4>База кандидатов</h4>
                                <p style={{ color: 'var(--text-secondary)' }}>Используйте фильтры выше для поиска студентов по всей платформе.</p>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'responses' && (
                    <div>
                        <h3 className="mb-4">Отклики на вакансии</h3>
                        {responsesLoading ? (
                            <div className="text-center p-8"><div className="loading mx-auto"></div></div>
                        ) : responses.length === 0 ? (
                            <div className="card text-center" style={{ padding: '3rem' }}>
                                <GraduationCap size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                                <h4>Откликов пока нет</h4>
                                <p style={{ color: 'var(--text-secondary)' }}>Отклики на ваши вакансии появятся здесь.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {responses.map((r) => (
                                    <div key={r.id} className="card">
                                        <div className="card-body">
                                            <h4 className="card-title">{r.vacancies?.title ?? 'Вакансия'}</h4>
                                            <p><strong>Студент:</strong> {r.student_profiles?.users?.full_name ?? '—'} ({r.student_profiles?.users?.email ?? '—'})</p>
                                            <p><strong>Резюме:</strong> {r.resumes ? r.resumes.title : 'Без резюме'}</p>
                                            <p><strong>Дополнительная информация:</strong> {r.additional_info ?? 'Не указано'}</p>
                                            <p><strong>Статус:</strong> <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'accepted' ? 'badge-success' : 'badge-error'}`}>{r.status ?? '—'}</span></p>

                                            {(
                                                (r.motivation_rating != null)
                                                || (r.motivation_score != null)
                                                || (r.meets_criteria_rating != null)
                                                || (r.meets_creteria_rating != null)
                                            ) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                                        {(r.motivation_rating != null || r.motivation_score != null) && (
                                                            <div className="flex items-center gap-2">
                                                                <Star size={16} className="text-yellow-500" />
                                                                <strong>Мотивация:</strong>
                                                                <span className="font-semibold">{Number(r.motivation_rating ?? r.motivation_score)}/100</span>
                                                            </div>
                                                        )}
                                                        {(r.meets_criteria_rating != null || r.meets_creteria_rating != null) && (
                                                            <div className="flex items-center gap-2">
                                                                <Target size={16} className="text-green-500" />
                                                                <strong>Соответствие:</strong>
                                                                <span className="font-semibold">{Number(r.meets_criteria_rating ?? r.meets_creteria_rating)}/100</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            <div className="flex gap-2 mt-2">
                                                <button className="btn btn-success btn-sm">Принять</button>
                                                <button className="btn btn-error btn-sm">Отклонить</button>
                                                <button className="btn btn-outline btn-sm">Связаться</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {viewingResume && (
                    <div className="modal-overlay" onClick={() => setViewingResume(null)}>
                        <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{viewingResume.title || "Резюме"}</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setViewingResume(null)}>Закрыть</button>
                            </div>
                            <div className="modal-body">
                                <pre className="resume-content">
                                    {viewingResume.content}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    .link-button {
                        background: none; border: none;
                        color: var(--primary-color, #007bff);
                        text-decoration: underline; cursor: pointer;
                        padding: 0; font-size: inherit;
                    }
                    .resume-content {
                        white-space: pre-wrap; word-wrap: break-word;
                        font-family: inherit; font-size: 0.9rem;
                        line-height: 1.6; color: var(--text-secondary);
                    }
                `}</style>
            </div>
        </div>
    );
}

export default CompanyDashboard;