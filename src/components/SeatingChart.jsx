import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, User, Skull, Check, RotateCcw, PlayCircle, Edit2 } from 'lucide-react';

const SeatingChart = ({ players, setPlayers, onResetGame, onNextGame, addLog }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({
        width: Math.min(window.innerWidth, 900),
        height: Math.min(window.innerHeight * 0.8, 700)
    });

    // Drag and Drop State
    const [draggingId, setDraggingId] = useState(null);

    const [dropIndex, setDropIndex] = useState(null); // Changed from dragOverId to dropIndex
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const longPressTimerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            const updateSize = () => {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            };
            updateSize();
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }
    }, []);

    const addPlayer = () => {
        const newId = Math.max(...players.map(p => p.id), 0) + 1;
        setPlayers([...players, { id: newId, name: `玩家 ${newId}`, isDead: false, role: null }]);
    };

    const removePlayer = (id) => setPlayers(players.filter(p => p.id !== id));

    const toggleDead = (id) => {
        const player = players.find(p => p.id === id);
        if (player) {
            const newStatus = !player.isDead;
            setPlayers(players.map(p => p.id === id ? { ...p, isDead: newStatus } : p));

            // Add log entry
            if (addLog) {
                if (newStatus) {
                    addLog(`${player.name} 死亡`, 'user');
                } else {
                    addLog(`${player.name} 复活`, 'user');
                }
            }
        }
    };

    const updateName = (id, newName) => setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));

    const handleEditClick = (player) => {
        setEditingId(player.id);
        setEditName(player.name);
        setIsEditingName(false);
    };

    const handleNameConfirm = () => {
        if (editName.trim()) updateName(editingId, editName.trim());
        setIsEditingName(false);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, player) => {
        // Prevent default only for mouse events to allow scrolling on touch until long press?
        // Actually for this app, we want immediate drag or long press?
        // Let's go with immediate drag for mouse, maybe hold for touch?
        // For simplicity, let's try immediate for both but handle touch carefully.

        if (isEditingName || editingId) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Calculate offset from the element center or top-left?
        // Let's just track cursor position.
        setDraggingId(player.id);
        setDragPosition({ x: clientX, y: clientY });

        // Disable scrolling on touch devices while dragging
        if (e.touches) {
            document.body.style.overflow = 'hidden';
        }

        // Add global listeners
        if (e.touches) {
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        } else {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
        }
    };

    const handleDragMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        setDragPosition({ x: clientX, y: clientY });

        // Calculate angle relative to center to determine insertion gap
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate angle from center to cursor
            let angle = Math.atan2(clientY - centerY, clientX - centerX);

            // Normalize angle to 0-2PI starting from -PI/2 (Top) clockwise
            let normalizedAngle = angle + Math.PI / 2;
            if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

            // Calculate which gap (between players) is closest
            const totalGaps = players.length;
            const gapAngle = (2 * Math.PI) / totalGaps;

            // Gap index calculation
            const rawIndex = normalizedAngle / gapAngle;
            let gapIndex = Math.floor(rawIndex + 0.5) % totalGaps;

            setDropIndex(gapIndex);
        }

        if (e.cancelable) e.preventDefault();
    };

    const handleDragEnd = () => {
        // Clean up listeners
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
        document.body.style.overflow = '';

        setDraggingId((currentDraggingId) => {
            setDropIndex((currentDropIndex) => {
                if (currentDraggingId && currentDropIndex !== null) {
                    setPlayers(prevPlayers => {
                        const oldIndex = prevPlayers.findIndex(p => p.id === currentDraggingId);
                        if (oldIndex === -1) return prevPlayers;

                        // If dropping at same position, do nothing
                        if (oldIndex === currentDropIndex) return prevPlayers;

                        const newPlayers = [...prevPlayers];
                        const [removed] = newPlayers.splice(oldIndex, 1);

                        // Adjust insertion index if needed
                        let insertIndex = currentDropIndex;
                        if (oldIndex < currentDropIndex) {
                            insertIndex = currentDropIndex - 1;
                        }

                        newPlayers.splice(insertIndex, 0, removed);

                        return newPlayers;
                    });
                }
                return null;
            });
            return null;
        });
    };


    const getPlayerPosition = (index, total, width, height) => {
        const playerCount = total;
        let padding, useCircle;

        if (playerCount <= 8) {
            useCircle = true;
            padding = 60;
        } else if (playerCount <= 12) {
            useCircle = false;
            padding = 60;
        } else if (playerCount <= 16) {
            useCircle = false;
            padding = 50;
        } else {
            useCircle = false;
            padding = 40;
        }

        if (useCircle) {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - padding;
            const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        } else {
            const cornerRadius = Math.min(80, Math.min(width, height) / 6);
            const rectWidth = width - 2 * padding;
            const rectHeight = height - 2 * padding;
            const topEdge = rectWidth - 2 * cornerRadius;
            const rightEdge = rectHeight - 2 * cornerRadius;
            const bottomEdge = rectWidth - 2 * cornerRadius;
            const leftEdge = rectHeight - 2 * cornerRadius;
            const cornerArc = (Math.PI / 2) * cornerRadius;
            const totalPerimeter = topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc + leftEdge + cornerArc;
            const position = (index / total) * totalPerimeter;

            let x, y, accumulated = 0;

            if (position < topEdge) {
                x = padding + cornerRadius + position;
                y = padding;
            } else if (position < topEdge + cornerArc) {
                accumulated = topEdge;
                const angle = ((position - accumulated) / cornerArc) * (Math.PI / 2) - Math.PI / 2;
                x = width - padding - cornerRadius + cornerRadius * Math.cos(angle);
                y = padding + cornerRadius + cornerRadius * Math.sin(angle);
            } else if (position < topEdge + cornerArc + rightEdge) {
                accumulated = topEdge + cornerArc;
                x = width - padding;
                y = padding + cornerRadius + (position - accumulated);
            } else if (position < topEdge + cornerArc + rightEdge + cornerArc) {
                accumulated = topEdge + cornerArc + rightEdge;
                const angle = ((position - accumulated) / cornerArc) * (Math.PI / 2);
                x = width - padding - cornerRadius + cornerRadius * Math.cos(angle);
                y = height - padding - cornerRadius + cornerRadius * Math.sin(angle);
            } else if (position < topEdge + cornerArc + rightEdge + cornerArc + bottomEdge) {
                accumulated = topEdge + cornerArc + rightEdge + cornerArc;
                x = width - padding - cornerRadius - (position - accumulated);
                y = height - padding;
            } else if (position < topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc) {
                accumulated = topEdge + cornerArc + rightEdge + cornerArc + bottomEdge;
                const angle = ((position - accumulated) / cornerArc) * (Math.PI / 2) + Math.PI / 2;
                x = padding + cornerRadius + cornerRadius * Math.cos(angle);
                y = height - padding - cornerRadius + cornerRadius * Math.sin(angle);
            } else if (position < topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc + leftEdge) {
                accumulated = topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc;
                x = padding;
                y = height - padding - cornerRadius - (position - accumulated);
            } else {
                accumulated = topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc + leftEdge;
                const angle = ((position - accumulated) / cornerArc) * (Math.PI / 2) + Math.PI;
                x = padding + cornerRadius + cornerRadius * Math.cos(angle);
                y = padding + cornerRadius + cornerRadius * Math.sin(angle);
            }

            return { x, y };
        }
    };

    return (
        <div className="seating-chart">
            <div ref={containerRef} className="seating-container">
                {/* Center Area: Connected Hub */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}>
                    {/* Main Add Button */}
                    <div
                        className="glass-panel"
                        onClick={addPlayer}
                        style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            gap: '2px',
                            zIndex: 20,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.2))'
                        }}
                    >
                        <Plus size={32} color="var(--color-gold)" strokeWidth={2.5} />
                        <span style={{ fontSize: '11px', color: 'var(--color-mist)', fontWeight: '500' }}>{players.length} 人</span>
                    </div>

                    {/* Connected Control Dock */}
                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        padding: '24px 24px 10px 24px',
                        marginTop: '-20px', // Overlap to connect
                        borderRadius: '0 0 24px 24px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderTop: 'none',
                        zIndex: 10,
                        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.5)'
                    }}>
                        <button
                            onClick={onResetGame}
                            title="结束游戏"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#ff6b6b',
                                cursor: 'pointer',
                                fontSize: '10px',
                                opacity: 0.8,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                        >
                            <RotateCcw size={18} />
                            <span>重置</span>
                        </button>

                        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)', height: '24px' }} />

                        <button
                            onClick={onNextGame}
                            title="下一局"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-gold)',
                                cursor: 'pointer',
                                fontSize: '10px',
                                opacity: 0.8,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                        >
                            <PlayCircle size={18} />
                            <span>下一局</span>
                        </button>
                    </div>
                </div>

                {players.map((player, index) => {
                    const { x, y } = getPlayerPosition(index, players.length, containerSize.width, containerSize.height);
                    return (
                        <div
                            key={player.id}
                            className="player-node"
                            style={{
                                left: x,
                                top: y,
                                opacity: draggingId === player.id ? 0.3 : 1,
                                transition: 'transform 0.2s, opacity 0.2s',
                                zIndex: 1
                            }}
                            data-player-id={player.id}
                        >
                            <div
                                className={`player-avatar ${player.isDead ? 'dead' : ''}`}
                                onClick={() => !draggingId && handleEditClick(player)}
                                onMouseDown={(e) => handleDragStart(e, player)}
                                onTouchStart={(e) => handleDragStart(e, player)}
                                style={{
                                    cursor: 'grab'
                                }}
                            >
                                {player.isDead ? <Skull size={20} /> : <User size={20} />}
                                <div className={`player-name ${player.isDead ? 'dead' : ''}`} title={player.name}>{player.name}</div>
                            </div>
                        </div>
                    );
                })}

                {/* Dragging Ghost */}
                {draggingId && (
                    <div
                        className="dragging-ghost"
                        style={{
                            position: 'fixed',
                            left: dragPosition.x,
                            top: dragPosition.y,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: 100,
                            opacity: 0.9
                        }}
                    >
                        <div
                            className={`player-avatar ${players.find(p => p.id === draggingId)?.isDead ? 'dead' : ''}`}
                            style={{
                                width: '60px',
                                height: '60px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                scale: '1.1'
                            }}
                        >
                            {players.find(p => p.id === draggingId)?.isDead ? <Skull size={24} /> : <User size={24} />}
                            <div className="player-name">{players.find(p => p.id === draggingId)?.name}</div>
                        </div>
                    </div>
                )}

                {/* Insertion Indicator */}
                {draggingId && dropIndex !== null && (
                    <div
                        style={{
                            position: 'absolute',
                            left: getPlayerPosition(dropIndex - 0.5, players.length, containerSize.width, containerSize.height).x,
                            top: getPlayerPosition(dropIndex - 0.5, players.length, containerSize.width, containerSize.height).y,
                            width: '4px',
                            height: '60px',
                            borderRadius: '2px',
                            background: 'var(--color-gold)',
                            transform: `translate(-50%, -50%) rotate(${((dropIndex - 0.5) / players.length) * 360}deg)`,
                            boxShadow: '0 0 15px var(--color-gold), 0 0 5px rgba(255,255,255,0.8)',
                            zIndex: 90,
                            pointerEvents: 'none',
                            transition: 'all 0.1s ease-out'
                        }}
                    />
                )}
            </div>

            {/* Edit Modal */}
            {editingId && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => { setEditingId(null); setEditName(''); }}>
                    <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '320px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', color: 'var(--color-gold)' }}>编辑玩家</h3>
                            <button onClick={() => { setEditingId(null); setEditName(''); }} style={{ color: 'var(--color-mist)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-mist)', marginBottom: '8px' }}>名字</label>
                            {isEditingName ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={handleNameConfirm}
                                        onKeyPress={(e) => e.key === 'Enter' && handleNameConfirm()}
                                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-gold)', borderRadius: '4px', padding: '8px', color: 'var(--color-ghost)', outline: 'none' }}
                                        autoFocus
                                    />
                                    <button onClick={handleNameConfirm} style={{ padding: '8px', color: 'var(--color-gold)', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--color-gold)', borderRadius: '4px', cursor: 'pointer' }}>
                                        <Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsEditingName(true)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-mist)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <span style={{ fontSize: '16px', color: 'var(--color-ghost)' }}>{editName}</span>
                                    <Edit2 size={14} color="var(--color-mist)" />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => { toggleDead(editingId); setEditingId(null); setEditName(''); }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: players.find(p => p.id === editingId)?.isDead ? '1px solid var(--color-gold)' : '1px solid #500', color: players.find(p => p.id === editingId)?.isDead ? 'var(--color-gold)' : '#f55', background: 'rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {players.find(p => p.id === editingId)?.isDead ? <><User size={16} /> 复活</> : <><Skull size={16} /> 处决/死亡</>}
                            </button>
                            <button onClick={() => { removePlayer(editingId); setEditingId(null); setEditName(''); }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #666', color: '#999', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}>移除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatingChart;
