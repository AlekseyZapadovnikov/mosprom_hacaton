// --- START OF FILE RegisterPage.jsx ---

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Добавлены иконки Link2 для сайта и обновлен список
import { UserPlus, Mail, Lock, User, Briefcase, GraduationCap, Building, AlertCircle, Shield, Link2 } from 'lucide-react';
import { authAPI } from '../services/api';

function RegisterPage({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        user_type: 'student',
        company_name: '',
        inn: '',
        company_website: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Формируем объект для отправки, чтобы не посылать лишние данные
        let payload = {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            user_type: formData.user_type,
        };

        if (formData.user_type === 'company') {
            payload = {
                ...payload,
                company_name: formData.company_name,
                inn: formData.inn,
                // Отправляем сайт, только если он указан
                company_website: formData.company_website || null,
            };
        }

        try {
            // Отправляем подготовленный payload
            const response = await authAPI.register(payload);
            onLogin(response.data.user, response.data.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка регистрации. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div className="card" style={{ maxWidth: '550px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--primary-color, #4f46e5)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white'
                    }}>
                        <UserPlus size={32} />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Регистрация</h2>
                    <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
                        Создайте аккаунт в Карьерном центре
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            {/* Динамическая метка в зависимости от типа пользователя */}
                            {formData.user_type === 'student' ? 'Полное имя' : 'ФИО представителя'}
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="form-input"
                            placeholder={formData.user_type === 'student' ? 'Иван Иванов' : 'Иван Иванов (HR-менеджер)'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="your.email@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Пароль
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', marginTop: '0.25rem' }}>
                            Минимум 6 символов
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Тип аккаунта</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <label className={`radio-card ${formData.user_type === 'student' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="user_type"
                                    value="student"
                                    checked={formData.user_type === 'student'}
                                    onChange={handleChange}
                                    className="radio-card-input"
                                />
                                <GraduationCap size={28} className="radio-card-icon" />
                                <div className="radio-card-label">Студент</div>
                            </label>

                            <label className={`radio-card ${formData.user_type === 'company' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="user_type"
                                    value="company"
                                    checked={formData.user_type === 'company'}
                                    onChange={handleChange}
                                    className="radio-card-input"
                                />
                                <Briefcase size={28} className="radio-card-icon" />
                                <div className="radio-card-label">Компания</div>
                            </label>
                        </div>
                    </div>

                    {/* --- НОВЫЙ БЛОК: Поля для компании --- */}
                    {formData.user_type === 'company' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">
                                    <Building size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    Название компании
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="ОЭЗ 'Технополис Москва'"
                                    required={formData.user_type === 'company'}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Shield size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    ИНН компании
                                </label>
                                <input
                                    type="text"
                                    name="inn"
                                    value={formData.inn}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="10 или 12 цифр"
                                    required={formData.user_type === 'company'}
                                    pattern="\d{10}|\d{12}"
                                    title="ИНН должен состоять из 10 или 12 цифр."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Link2 size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    Сайт компании (необязательно)
                                </label>
                                <input
                                    type="url"
                                    name="company_website"
                                    value={formData.company_website}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </>
                    )}
                    {/* --- КОНЕЦ НОВОГО БЛОКА --- */}


                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="loading" style={{ width: '1rem', height: '1rem' }}></div>
                                Регистрация...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Зарегистрироваться
                            </>
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--border-color, #e5e7eb)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
                        Уже есть аккаунт?{' '}
                        <Link to="/login" style={{ color: 'var(--primary-color, #4f46e5)', fontWeight: 500 }}>
                            Войти
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;