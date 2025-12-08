import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Plus, Trash2, Edit2, X, CornerDownRight, Clock } from 'lucide-react';

// Helper to compute theme colors based on day/night
const getTheme = (isNight) => {
    return {
        bg: isNight ? 'rgba(30,30,80,0.6)' : 'rgba(80,50,0,0.6)',
        border: isNight ? 'rgba(100,120,250,0.4)' : 'rgba(250,180,50,0.4)',
        shadow: isNight ? '0 4px 12px rgba(100,120,250,0.3)' : '0 4px 12px rgba(250,180,50,0.3)',
        accent: isNight ? '#a6b1ff' : '#ffcf66',
        text: isNight ? '#cfd8ff' : '#ffecb3',
        dot: isNight ? '#a6b1ff' : '#ffcf66',
    };
};

const GameLog = ({ logs, setLogs, dayCount, setDayCount, isNight, setIsNight, addLog, showConfirm }) => {
    const [newLog, setNewLog] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [insertingId, setInsertingId] = useState(null);
    const [phaseAddingId, setPhaseAddingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [insertText, setInsertText] = useState('');
    const textareaRef = useRef(null);
    const logContainerRef = useRef(null);

    // Auto‑resize textarea for new log input
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newLog]);

    const handleAddLog = () => {
        if (!newLog.trim()) return;
        addLog(newLog, 'user');
        setNewLog('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const deleteLog = (id) => {
        if (showConfirm) {
            showConfirm('确定要删除这条记录吗？', () => {
                setLogs(logs.filter((log) => log.id !== id));
            });
        } else {
            setLogs(logs.filter((log) => log.id !== id));
        }
    };

    const startEdit = (log) => {
        setEditingId(log.id);
        setEditText(log.text);
        setInsertingId(null);
        setPhaseAddingId(null);
    };

    const saveEdit = () => {
        setLogs(logs.map((log) => (log.id === editingId ? { ...log, text: editText } : log)));
        setEditingId(null);
        setEditText('');
    };

    const startInsert = (id) => {
        setInsertingId(id);
        setInsertText('');
        setEditingId(null);
        setPhaseAddingId(null);
    };

    const confirmInsert = () => {
        if (!insertText.trim()) return;
        const index = logs.findIndex((log) => log.id === insertingId);
        if (index === -1) return;
        const newEntry = {
            id: Date.now(),
            text: insertText,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            type: 'user',
        };
        const newLogs = [...logs];
        newLogs.splice(index + 1, 0, newEntry);
        setLogs(newLogs);
        setInsertingId(null);
        setInsertText('');
    };

    const startPhaseAdd = (id) => {
        setPhaseAddingId(id);
        setInsertText('');
        setEditingId(null);
        setInsertingId(null);
    };

    const confirmPhaseAdd = () => {
        if (!insertText.trim()) return;
        const index = logs.findIndex((log) => log.id === phaseAddingId);
        if (index === -1) return;
        const newEntry = {
            id: Date.now(),
            text: insertText,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            type: 'user',
        };
        const newLogs = [...logs];
        newLogs.splice(index + 1, 0, newEntry);
        setLogs(newLogs);
        setPhaseAddingId(null);
        setInsertText('');
    };

    const togglePhase = () => {
        // If no logs yet, enter first night
        if (logs.length === 0) {
            addLog(`=== 第 1 夜 ===`, 'phase');
            return;
        }

        if (isNight) {
            setIsNight(false);
            addLog(`=== 第 ${dayCount} 天 ===`, 'phase');
        } else {
            setIsNight(true);
            setDayCount(dayCount + 1);
            addLog(`=== 第 ${dayCount + 1} 夜 ===`, 'phase');
        }
    };

    // Determine day/night context for each log entry
    const getLogContext = (logs) => {
        let night = true;
        const map = {};
        logs.forEach((log) => {
            if (log.type === 'phase') {
                if (log.text.includes('夜')) night = true;
                else if (log.text.includes('天')) night = false;
            }
            map[log.id] = night;
        });
        return map;
    };

    const logContexts = getLogContext(logs);

    return (
        <div
            className="game-log flex flex-col h-full relative"
            style={{ background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', maxWidth: '100%', width: '100%' }}
        >
            {/* Header */}
            <div
                className="px-4 py-3 flex justify-between items-center sticky top-0 z-10"
                style={{
                    background: 'linear-gradient(to bottom, #111, transparent)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(4px)',
                }}
            >
                <div className="flex flex-col">
                    <span style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                        Current Phase
                    </span>
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd700' }}>
                            第 {dayCount} {isNight ? '夜' : '天'}
                        </span>
                        <div style={{ padding: '6px', borderRadius: '50%', color: !isNight ? '#ffd700' : '#a6b1ff' }}>
                            {!isNight ? <Sun size={20} /> : <Moon size={20} />}
                        </div>
                    </div>
                </div>
                <button
                    onClick={togglePhase}
                    className="group"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#ccc',
                        transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = '#ccc';
                    }}
                >
                    <span style={{ fontSize: '0.75rem' }}>
                        {logs.length === 0 ? '进入首夜' : `进入${!isNight ? '夜晚' : '白天'}`}
                    </span>
                    {logs.length === 0 ? (
                        <Moon size={14} style={{ color: '#ccc' }} />
                    ) : !isNight ? (
                        <Moon size={14} style={{ color: '#ccc' }} />
                    ) : (
                        <Sun size={14} style={{ color: '#ccc' }} />
                    )}
                </button>
            </div>

            {/* Log List */}
            <div
                className="flex-1 overflow-y-auto pb-24"
                ref={logContainerRef}
                style={{ position: 'relative' }}
            >
                {/* Vertical line */}
                <div
                    style={{
                        position: 'absolute',
                        left: '24px',
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,215,0,0.2), transparent)',
                    }}
                />
                {logs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.4, color: '#aaa' }}>
                        <div style={{ marginBottom: '1rem', fontStyle: 'italic' }}>The story begins...</div>
                        <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>Write your first entry below</p>
                    </div>
                )}
                <div className="space-y-6" style={{ paddingTop: '1rem' }}>
                    {logs.map((log) => {
                        const isNightLog = logContexts[log.id];
                        const theme = getTheme(isNightLog);
                        if (log.type === 'phase') {
                            return (
                                <div key={log.id} style={{ margin: '1.5rem 0', position: 'relative' }}>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            height: '1px',
                                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            background: isNightLog ? 'rgba(100,120,250,0.2)' : 'rgba(250,180,50,0.2)',
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '9999px',
                                            color: isNightLog ? '#a6b1ff' : '#ffd700',
                                            fontWeight: 'bold',
                                            fontFamily: 'Cinzel, serif',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        {log.text.replace(/===/g, '').trim()}
                                    </div>
                                    <button
                                        onClick={() => startPhaseAdd(log.id)}
                                        title="在此阶段新增记录"
                                        style={{
                                            position: 'absolute',
                                            right: '0',
                                            top: '-8px',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,215,0,0.1)',
                                            border: '1px solid rgba(255,215,0,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffd700',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
                                        }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                    {
                                        phaseAddingId === log.id && (
                                            <div style={{ marginTop: '8px', marginLeft: '12px', marginRight: '12px' }}>
                                                <div
                                                    style={{
                                                        background: 'rgba(0,0,0,0.6)',
                                                        border: '1px solid #d4af37',
                                                        borderRadius: '8px',
                                                        padding: '8px',
                                                        backdropFilter: 'blur(4px)',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ color: '#d4af37', fontSize: '0.85rem' }}>
                                                            <Plus size={12} /> 在此阶段新增
                                                        </span>
                                                        <button onClick={() => setPhaseAddingId(null)} style={{ color: '#ccc' }}>
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={insertText}
                                                        onChange={(e) => setInsertText(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            background: 'rgba(0,0,0,0.4)',
                                                            border: '1px solid #fff',
                                                            borderRadius: '8px',
                                                            padding: '6px',
                                                            color: '#fff',
                                                            fontFamily: 'serif',
                                                            fontSize: '0.9rem',
                                                        }}
                                                        rows={2}
                                                        autoFocus
                                                        placeholder="输入内容 (Enter换行)..."
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                        <button
                                                            onClick={confirmPhaseAdd}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                background: '#d4af37',
                                                                color: '#000',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.75rem',
                                                            }}
                                                        >
                                                            确认
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                            );
                        }
                        return (
                            <div key={log.id} style={{ position: 'relative', marginBottom: '1rem' }}>
                                {/* Timeline dot */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '12px',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: theme.dot,
                                        boxShadow: `0 0 6px ${theme.dot}`,
                                    }}
                                />
                                {/* Card */}
                                <div
                                    style={{
                                        marginLeft: '32px',
                                        background: theme.bg,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: '12px',
                                        padding: '12px',
                                        boxShadow: theme.shadow,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: theme.accent,
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                color: '#000',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                            }}
                                        >
                                            <Clock size={16} />
                                            <span>{log.time}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => startInsert(log.id)}
                                                title="插入"
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(16,185,129,0.1)',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    color: '#10b981',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(16,185,129,0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
                                                }}
                                            >
                                                <CornerDownRight size={18} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => startEdit(log)}
                                                title="编辑"
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(59,130,246,0.1)',
                                                    border: '1px solid rgba(59,130,246,0.3)',
                                                    color: '#3b82f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                                }}
                                            >
                                                <Edit2 size={18} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => deleteLog(log.id)}
                                                title="删除"
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(239,68,68,0.1)',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    color: '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                                }}
                                            >
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                    {editingId === log.id ? (
                                        <div>
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0,0,0,0.4)',
                                                    border: '1px solid #d4af37',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    color: '#fff',
                                                    fontFamily: 'serif',
                                                    fontSize: '1rem',
                                                }}
                                                rows={3}
                                                autoFocus
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        color: '#aaa',
                                                        background: 'rgba(255,255,255,0.05)',
                                                    }}
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    onClick={saveEdit}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        background: '#d4af37',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    保存
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: theme.text, lineHeight: '1.5', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{log.text}</div>
                                    )}
                                </div>
                                {/* Insert box */}
                                {insertingId === log.id && (
                                    <div style={{ marginTop: '8px', marginLeft: '32px' }}>
                                        <div
                                            style={{
                                                background: 'rgba(0,0,0,0.6)',
                                                border: '1px solid #d4af37',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: '#d4af37', fontSize: '0.85rem' }}>
                                                    <CornerDownRight size={12} /> 插入新记录
                                                </span>
                                                <button onClick={() => setInsertingId(null)} style={{ color: '#ccc' }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <textarea
                                                value={insertText}
                                                onChange={(e) => setInsertText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0,0,0,0.4)',
                                                    border: '1px solid #fff',
                                                    borderRadius: '8px',
                                                    padding: '6px',
                                                    color: '#fff',
                                                    fontFamily: 'serif',
                                                    fontSize: '0.9rem',
                                                }}
                                                rows={2}
                                                autoFocus
                                                placeholder="输入内容 (Enter换行)..."
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                <button
                                                    onClick={confirmInsert}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: '#d4af37',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    确认
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GameLog;
