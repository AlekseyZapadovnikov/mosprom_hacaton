import React, { useRef, useState, useEffect } from 'react';
import { TrendingUp, Users, Briefcase, GraduationCap, Building } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { analyticsAPI } from '../services/api';
import WordCloud from 'react-d3-cloud';

const ChartLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    {/* Вы можете использовать ваш существующий класс 'loading' или любой другой индикатор */}
    <div className="loading"></div>
  </div>
)

function AnalyticsPage({ user }) {
  const [analytics, setAnalytics] = useState({
    total_students: 0,
    total_companies: 0,
    active_vacancies: 0,
    active_internships: 0
  });
  const [loading, setLoading] = useState(true);

  const [vacancyChartData, setVacancyChartData] = useState([]);
  const [studentChartData, setStudentChartData] = useState([]);
  const [isVacancyChartLoading, setIsVacancyChartLoading] = useState(true);
  const [isStudentChartLoading, setIsStudentChartLoading] = useState(true);

  // Разделяем состояние гранулярности
  const [vacancyGranularity, setVacancyGranularity] = useState('day');
  const [studentGranularity, setStudentGranularity] = useState('day');

  const [companyActivityData, setCompanyActivityData] = useState([]);
  const [isCompanyActivityLoading, setIsCompanyActivityLoading] = useState(true);

  const [wordCloudData, setWordCloudData] = useState([]);
  const [isWordCloudLoading, setIsWordCloudLoading] = useState(true);

  const wordCloudWrapperRef = useRef(null); // Ref для ссылки на div-контейнер
  const [size, setSize] = useState({ width: 0, height: 0 }); // State для хранения размеров

  // Этот useEffect измерит контейнер после его отрисовки
  useEffect(() => {
    if (wordCloudWrapperRef.current) {
      setSize({
        width: wordCloudWrapperRef.current.clientWidth,
        height: wordCloudWrapperRef.current.clientHeight,
      });
    }
  }, [isWordCloudLoading]);

    useEffect(() => {
      loadAnalytics();
    }, []);

  useEffect(() => {
    const loadWordCloud = async () => {
      setIsWordCloudLoading(true);
      try {
        const response = await analyticsAPI.getWordCloudData();
        if (Array.isArray(response.data)) {
          setWordCloudData(response.data);
        }
      } catch (error) {
        console.error("Error loading word cloud data:", error);
        setWordCloudData([]);
      } finally {
        setIsWordCloudLoading(false);
      }
    };
    loadWordCloud();
  }, []); // Пустой массив зависимостей для загрузки один раз

  useEffect(() => {
    const loadCompanyActivity = async () => {
      setIsCompanyActivityLoading(true);
      try {
        const response = await analyticsAPI.getCompanyActivityStats();
        if (Array.isArray(response.data)) {
          setCompanyActivityData(response.data);
        }
      } catch (error) {
        console.error("Error loading company activity data:", error);
        setCompanyActivityData([]);
      } finally {
        setIsCompanyActivityLoading(false);
      }
    };
    loadCompanyActivity();
  }, []);

  // --- 👇 useEffect для загрузки данных для ОБОИХ графиков ---
  useEffect(() => {
  const loadVacancyData = async () => {
    setIsVacancyChartLoading(true);
    try {
      const response = await analyticsAPI.getVacancyStatsByTime(vacancyGranularity);
      if (Array.isArray(response.data)) {
        const formattedData = response.data.map(item => ({
          ...item,
          period: new Date(item.period).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        }));
        setVacancyChartData(formattedData);
      } else {
        setVacancyChartData([]);
      }
    } catch (error) {
      console.error('Error loading vacancy chart data:', error);
      setVacancyChartData([]);
    } finally {
      setIsVacancyChartLoading(false);
    }
  };
  loadVacancyData();
}, [vacancyGranularity]); // <-- Зависит только от гранулярности вакансий

// useEffect №2: Загрузка данных для графика студентов
useEffect(() => {
  const loadStudentData = async () => {
    setIsStudentChartLoading(true);
    try {
      const response = await analyticsAPI.getStudentRegistrationStats(studentGranularity);
      if (Array.isArray(response.data)) {
        const formattedData = response.data.map(item => ({
          ...item,
          period: new Date(item.period).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        }));
        setStudentChartData(formattedData);
      } else {
        setStudentChartData([]);
      }
    } catch (error) {
      console.error('Error loading student chart data:', error);
      setStudentChartData([]);
    } finally {
      setIsStudentChartLoading(false);
    }
  };
  loadStudentData();
}, [studentGranularity]); // <-- Зависит только от гранулярности студентов



  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getOverview();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
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
          <h1 style={{ marginBottom: '0.5rem' }}>Аналитика платформы</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Общая статистика Карьерного центра Технополис Москва
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)'
              }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Студентов
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  {analytics.total_students}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <TrendingUp size={14} />
              Зарегистрировано на платформе
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary-color)'
              }}>
                <Building size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Компаний
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary-color)' }}>
                  {analytics.total_companies}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <TrendingUp size={14} />
              Партнеров платформы
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-color)'
              }}>
                <Briefcase size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Вакансий
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                  {analytics.active_vacancies}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <TrendingUp size={14} />
              Активных предложений
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--error-color)'
              }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Стажировок
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--error-color)' }}>
                  {analytics.active_internships}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <TrendingUp size={14} />
              Доступно для студентов
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
          <h3 className="card-title mb-4">Самые частые навыки в резюме</h3>
          {/* 👇 Добавляем ref сюда */}
          <div ref={wordCloudWrapperRef} style={{ height: '300px', width: '100%' }}>
            {isWordCloudLoading ? <ChartLoader /> : (
              // 👇 Проверяем, что размеры были измерены, перед тем как рендерить облако
              size.width > 0 && (
                <WordCloud
                  data={wordCloudData}
                  // 👇 Явно передаем измеренные размеры
                  width={size.width}
                  height={size.height}
                  font="Inter, sans-serif"
                  fontSize={(word) => Math.log2(word.value) * 5 + 16}
                  rotate={0}
                  padding={2}
                  onWordClick={(event, d) => {
                    console.log(`clicked: ${d.text}`);
                  }}
                />
              )
            )}
          </div>
        </div>

          <div className="card">
            <h3 className="card-title mb-4">Активность компаний (Топ-10)</h3>
            <div style={{ height: '300px' }}>
              {isCompanyActivityLoading ? <ChartLoader /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={companyActivityData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis
                      dataKey="company_name"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      interval={0} // Показываем все названия, можно убрать если их много
                    />
                    <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                    <Legend />
                    <Bar dataKey="vacancy_count" name="Вакансий" fill="var(--primary-color)" />
                    <Bar dataKey="response_count" name="Откликов" fill="var(--secondary-color)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Динамика вакансий</h3>
              <div className="flex items-center gap-2">
                <button className={`btn btn-sm ${vacancyGranularity === 'day' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVacancyGranularity('day')}>День</button>
                <button className={`btn btn-sm ${vacancyGranularity === 'week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVacancyGranularity('week')}>Неделя</button>
                <button className={`btn btn-sm ${vacancyGranularity === 'month' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVacancyGranularity('month')}>Месяц</button>
              </div>
            </div>
            <div style={{ height: '300px' }}>
              {isVacancyChartLoading ? <ChartLoader /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vacancyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="period" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Новых вакансий" stroke="var(--primary-color)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Динамика регистраций</h3>
              <div className="flex items-center gap-2">
                <button className={`btn btn-sm ${studentGranularity === 'day' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStudentGranularity('day')}>День</button>
                <button className={`btn btn-sm ${studentGranularity === 'week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStudentGranularity('week')}>Неделя</button>
                <button className={`btn btn-sm ${studentGranularity === 'month' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStudentGranularity('month')}>Месяц</button>
              </div>
            </div>
            <div style={{ height: '300px' }}>
              {isStudentChartLoading ? <ChartLoader /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="period" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Новых студентов" stroke="var(--secondary-color)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card mt-6">
          <h3 className="card-title mb-3">О платформе</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Карьерный центр Технополис Москва - это единая платформа для соединения студентов, 
            компаний-резидентов и вузов. Мы помогаем студентам найти работу мечты, компаниям - 
            талантливых специалистов, а вузам - отслеживать трудоустройство своих выпускников.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;