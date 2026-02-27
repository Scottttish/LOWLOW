import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './ActionLog.css';
import { Search, RotateCcw, Filter, RefreshCw } from 'lucide-react';

const ActionLog = () => {
    const { getActionLogs, undoAction } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getActionLogs();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load action logs:', err);
            setError(err.message || 'Ошибка загрузки журнала действий');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async (logId) => {
        if (window.confirm('Вы уверены, что хотите отменить это действие?')) {
            try {
                await undoAction(logId);
                alert('Действие успешно отменено!');
                loadLogs();
            } catch (err) {
                alert('Ошибка при отмене действия: ' + err.message);
            }
        }
    };

    const filteredLogs = logs.filter(log => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (log.description?.toLowerCase() || '').includes(searchLower) ||
            (log.user_name?.toLowerCase() || '').includes(searchLower) ||
            (log.action_type?.toLowerCase() || '').includes(searchLower);

        const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;

        return matchesSearch && matchesAction;
    });

    const getActionBadgeClass = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('create')) return 'action-type-badge action-create';
        if (t.includes('update') || t.includes('edit')) return 'action-type-badge action-update';
        if (t.includes('delete') || t.includes('remove')) return 'action-type-badge action-delete';
        if (t.includes('undo') || t.includes('rollback')) return 'action-type-badge action-undo';
        return 'action-type-badge';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // We no longer return early for loading/error to keep the tab structure visible
    return (
        <div className="action-log-panel" ref={sectionRef}>
            <div className={`action-log-content ${isVisible ? 'action-log-visible' : ''}`}>

                {/* Заголовок */}
                <div className="action-log-header">
                    <h2 className="action-log-title">Журнал действий</h2>
                    <div className="action-log-controls">
                        <div className="action-log-search-box">
                            <input
                                type="text"
                                placeholder="Поиск по журналу..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="action-log-search-input"
                            />
                        </div>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="action-log-filter-select"
                        >
                            <option value="all">Все действия</option>
                            {[...new Set(logs.map(l => l.action_type).filter(Boolean))].map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button className="action-log-refresh-btn" onClick={loadLogs} disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spinning-icon' : ''} style={{ marginRight: '8px' }} />
                            Перезагрузить
                        </button>
                    </div>
                </div>

                {/* Статистика */}
                <div className="action-log-stats-container">
                    <div className="action-log-stat-card">
                        <div className="action-log-stat-number">{logs.length}</div>
                        <div className="action-log-stat-label">Всего действий</div>
                    </div>
                    <div className="action-log-stat-card">
                        <div className="action-log-stat-number">
                            {logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                        </div>
                        <div className="action-log-stat-label">За 24 часа</div>
                    </div>
                    <div className="action-log-stat-card">
                        <div className="action-log-stat-number">
                            {[...new Set(logs.map(l => l.action_type).filter(Boolean))].length}
                        </div>
                        <div className="action-log-stat-label">Типов действий</div>
                    </div>
                </div>

                {/* Таблица */}
                <div className="action-log-table-container">
                    {error && (
                        <div className="action-log-error-overlay">
                            <span className="error-icon">⚠️</span>
                            <span>{error}</span>
                            <button onClick={loadLogs}>Повторить</button>
                        </div>
                    )}
                    <table className="action-log-table">
                        <thead>
                            <tr>
                                <th>Сотрудник</th>
                                <th>Описание</th>
                                <th>Действие</th>
                                <th>Дата и время</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="action-log-loading-body">
                                            <div className="action-log-spinner"></div>
                                            Загрузка...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                                <tr key={log.id || idx}
                                    className={`action-log-row ${isVisible ? 'row-visible' : ''}`}
                                    style={{ animationDelay: `${idx * 0.03}s` }}
                                >
                                    <td className="action-log-employee-cell">
                                        <div className="action-log-user-info-unified">
                                            <strong>{log.user_name || 'Система'}</strong>
                                            <span>ID: {log.user_id || '0'}</span>
                                        </div>
                                    </td>
                                    <td className="action-log-description-cell">
                                        <div className="action-description-unified">
                                            {log.description || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={getActionBadgeClass(log.action_type)}>{log.action_type || '—'}</span>
                                    </td>
                                    <td>
                                        <div className="action-timestamp">
                                            <span className="user-date-badge date-specified">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="action-log-actions-cell">
                                        <div className="action-log-actions-wrapper">
                                            <button
                                                className="action-action-btn action-undo-btn"
                                                onClick={() => handleUndo(log.id)}
                                                title="Отменить действие"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5">
                                        <div className="action-log-no-data">
                                            {searchTerm
                                                ? 'Ничего не найдено по запросу «' + searchTerm + '»'
                                                : 'Записи в журнале действий отсутствуют.'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ActionLog;
