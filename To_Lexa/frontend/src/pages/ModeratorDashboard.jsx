import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Briefcase, Download, CheckCircle, XCircle, Search, Building } from 'lucide-react';
import { moderatorAPI } from '../services/api';

function ModeratorDashboard({ user }) {
    const [activeTab, setActiveTab] = useState('analytics');

    // State для данных
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [vacancies, setVacancies] = useState([]);
    const [universities, setUniversities] = useState([]); // НОВОЕ

    // State для UI
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // НОВОЕ: State для фильтров
    const [userTypeFilter, setUserTypeFilter] = useState('all');
    const [vacancyStatusFilter, setVacancyStatusFilter] = useState('all');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, usersRes, vacanciesRes, universitiesRes] = await Promise.all([
                moderatorAPI.getDetailedAnalytics(), // НОВОЕ: Запрашиваем расширенную аналитику
                moderatorAPI.getAllUsers(),
                moderatorAPI.getAllVacancies(),
                moderatorAPI.getAllUniversities() // НОВОЕ: Запрашиваем ВУЗы
            ]);
            setAnalytics(analyticsRes.data);
            setUsers(usersRes.data);
            setVacancies(vacanciesRes.data);
            setUniversities(universitiesRes.data);
        } catch (error) { console.error('Ошибка загрузки данных для модератора:', error); }
        finally { setLoading(false); }
    };

    const handleApproveVacancy = async (vacancyId) => {
        if (!window.confirm('Подтвердить вакансию?')) return;
        try { await moderatorAPI.approveVacancy(vacancyId); loadData(); }
        catch (error) { alert('Ошибка подтверждения вакансии'); }
    };

    const handleDeleteVacancy = async (vacancyId) => {
        if (!window.confirm('УДАЛИТЬ вакансию? Действие необратимо.')) return;
        try { await moderatorAPI.deleteVacancy(vacancyId); loadData(); }
        catch (error) { alert('Ошибка удаления вакансии'); }
    };

    // ИСПРАВЛЕНО: Функция выгрузки CSV с поддержкой кириллицы (BOM)
    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) { alert("Нет данных для скачивания."); return; }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header], '', '\t')).join(','))
        ].join('\n');

        // Добавляем BOM (Byte Order Mark), чтобы Excel правильно распознал UTF-8
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // НОВОЕ: Логика фильтрации
    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = userTypeFilter === 'all' || u.user_type === userTypeFilter;
        return matchesSearch && matchesType;
    });

    const filteredVacancies = vacancies.filter(v => {
        const matchesSearch = (v.title?.toLowerCase().includes(searchQuery.toLowerCase()) || v.company_profiles?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = vacancyStatusFilter === 'all' || v.status === vacancyStatusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="loading-overlay"><div className="loading"></div></div>;

    return (
        <div className="py-6" style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)' }}>
            <div className="container">
                <div style={{ marginBottom: '2rem' }}><h1 style={{ marginBottom: '0.5rem' }}>Панель модератора</h1><p style={{ color: 'var(--text-secondary)' }}>Управление платформой</p></div>
                <div className="tabs"><button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><TrendingUp size={18} /> Аналитика</button><button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={18} /> Пользователи</button><button className={`tab ${activeTab === 'vacancies' ? 'active' : ''}`} onClick={() => setActiveTab('vacancies')}><Briefcase size={18} /> Вакансии</button></div>

                {activeTab === 'analytics' && analytics && (
                    <div className="card">
                        <h3 className="card-title mb-4">Расширенная аналитика</h3>
                        <div className="grid grid-cols-4 gap-6 mb-6">
                            <div className="card text-center"><div className="stat-value">{analytics.users_by_type?.student || 0}</div><div className="stat-title">Студентов</div></div>
                            <div className="card text-center"><div className="stat-value">{analytics.users_by_type?.company || 0}</div><div className="stat-title">Компаний</div></div>
                            <div className="card text-center"><div className="stat-value">{analytics.users_by_type?.university || 0}</div><div className="stat-title">ВУЗов</div></div>
                            <div className="card text-center"><div className="stat-value">{analytics.total_users || 0}</div><div className="stat-title">Всего пользователей</div></div>
                            <div className="card text-center"><div className="stat-value" style={{ color: 'var(--success-color)' }}>{analytics.vacancies_by_status?.active || 0}</div><div className="stat-title">Активных вакансий</div></div>
                            <div className="card text-center"><div className="stat-value" style={{ color: 'var(--accent-color)' }}>{analytics.vacancies_by_status?.pending || 0}</div><div className="stat-title">На модерации</div></div>
                            <div className="card text-center"><div className="stat-value" style={{ color: 'var(--text-secondary)' }}>{analytics.vacancies_by_status?.archived || 0}</div><div className="stat-title">В архиве</div></div>
                            <div className="card text-center"><div className="stat-value">{analytics.total_vacancies || 0}</div><div className="stat-title">Всего вакансий</div></div>
                        </div>
                        <h3 className="card-title mb-4">Экспорт данных</h3>
                        <div className="flex gap-4 flex-wrap">
                            <button className="btn btn-outline" onClick={() => downloadCSV(users, 'пользователи.csv')}><Download size={16} /> Скачать пользователей (CSV)</button>
                            <button className="btn btn-outline" onClick={() => downloadCSV(vacancies, 'вакансии.csv')}><Download size={16} /> Скачать вакансии (CSV)</button>
                            <button className="btn btn-outline" onClick={() => downloadCSV(universities, 'вузы.csv')}><Building size={16} /> Скачать ВУЗы (CSV)</button>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="card">
                        <h3 className="card-title mb-4">Все пользователи ({filteredUsers.length})</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input type="text" className="form-input" placeholder="Поиск по имени или email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <select className="form-select" value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}>
                                <option value="all">Все типы</option><option value="student">Студенты</option><option value="company">Компании</option><option value="university">ВУЗы</option><option value="moderator">Модераторы</option>
                            </select>
                        </div>
                        <div className="table-container"><table className="moderator-table"><thead><tr><th>Имя</th><th>Email</th><th>Тип</th><th>Дата регистрации</th></tr></thead><tbody>{filteredUsers.map(u => (<tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td><td><span className="badge">{u.user_type}</span></td><td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td></tr>))}</tbody></table></div>
                    </div>
                )}

                {activeTab === 'vacancies' && (
                    <div className="card">
                        <h3 className="card-title mb-4">Все вакансии ({filteredVacancies.length})</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input type="text" className="form-input" placeholder="Поиск по названию или компании..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <select className="form-select" value={vacancyStatusFilter} onChange={(e) => setVacancyStatusFilter(e.target.value)}>
                                <option value="all">Все статусы</option><option value="active">Активные</option><option value="pending">На модерации</option><option value="archived">В архиве</option>
                            </select>
                        </div>
                        <div className="table-container"><table className="moderator-table"><thead><tr><th>Название</th><th>Компания</th><th>Статус</th><th>Действия</th></tr></thead><tbody>{filteredVacancies.map(v => (<tr key={v.id}><td>{v.title}</td><td>{v.company_profiles?.company_name || 'Не указана'}</td><td><span className={`badge ${v.status === 'active' ? 'badge-success' : v.status === 'pending' ? 'badge-warning' : 'badge-secondary'}`}>{v.status || 'pending'}</span></td><td className="flex gap-2">{v.status !== 'active' && <button title="Подтвердить" className="btn btn-success btn-sm" onClick={() => handleApproveVacancy(v.id)}><CheckCircle size={16} /></button>}<button title="Удалить" className="btn btn-error btn-sm" onClick={() => handleDeleteVacancy(v.id)}><XCircle size={16} /></button></td></tr>))}</tbody></table></div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModeratorDashboard;