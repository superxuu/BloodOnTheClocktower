import React, { useState, useEffect, useRef } from 'react';
import ScriptViewer from './components/ScriptViewer';
import SeatingChart from './components/SeatingChart';
import GameLog from './components/GameLog';
import Layout from './components/Layout';

function App() {
  const [activeTab, setActiveTab] = useState('script');

  // State lifted from SeatingChart
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('botc_players');
    return saved ? JSON.parse(saved) : [];
  });

  // State lifted from GameLog
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('botc_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [dayCount, setDayCount] = useState(() => {
    const saved = localStorage.getItem('botc_dayCount');
    return saved ? parseInt(saved) : 1;
  });
  const [isNight, setIsNight] = useState(() => {
    const saved = localStorage.getItem('botc_isNight');
    return saved ? JSON.parse(saved) : true;
  });

  // Custom role distribution
  const [customDistribution, setCustomDistribution] = useState(() => {
    const saved = localStorage.getItem('botc_customDistribution');
    return saved ? JSON.parse(saved) : null;
  });
  const [showDistributionEditor, setShowDistributionEditor] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState(null);

  // Save state changes
  useEffect(() => {
    localStorage.setItem('botc_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('botc_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('botc_dayCount', dayCount.toString());
  }, [dayCount]);

  useEffect(() => {
    localStorage.setItem('botc_isNight', JSON.stringify(isNight));
  }, [isNight]);

  useEffect(() => {
    if (customDistribution) {
      localStorage.setItem('botc_customDistribution', JSON.stringify(customDistribution));
    } else {
      localStorage.removeItem('botc_customDistribution');
    }
  }, [customDistribution]);

  // Initialize players if empty
  useEffect(() => {
    if (players.length === 0) {
      setPlayers([
        { id: 1, name: '玩家1', role: null, isDead: false, hasVoted: false, isGhostVoteUsed: false },
        { id: 2, name: '玩家2', role: null, isDead: false, hasVoted: false, isGhostVoteUsed: false },
        { id: 3, name: '玩家3', role: null, isDead: false, hasVoted: false, isGhostVoteUsed: false },
        { id: 4, name: '玩家4', role: null, isDead: false, hasVoted: false, isGhostVoteUsed: false },
        { id: 5, name: '玩家5', role: null, isDead: false, hasVoted: false, isGhostVoteUsed: false },
      ]);
    }
  }, [players.length]);

  // Reset custom distribution when player count changes
  const prevPlayerCountRef = useRef(players.length);
  useEffect(() => {
    if (prevPlayerCountRef.current !== players.length) {
      setCustomDistribution(null);
      prevPlayerCountRef.current = players.length;
    }
  }, [players.length]);

  // Helper to add log
  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [...prev, { id: Date.now(), time, text, type }]);
  };

  // Reset Game (Full Reset)
  const resetGame = () => {
    if (window.confirm('确定要结束当前游戏并重置所有内容吗？')) {
      setPlayers([
        { id: 1, name: '玩家 1', isDead: false, role: null },
        { id: 2, name: '玩家 2', isDead: false, role: null },
        { id: 3, name: '玩家 3', isDead: false, role: null },
        { id: 4, name: '玩家 4', isDead: false, role: null },
        { id: 5, name: '玩家 5', isDead: false, role: null },
      ]);
      setLogs([]);
      setDayCount(1);
      setIsNight(true);
    }
  };

  // Next Game (Keep players, reset status)
  const nextGame = () => {
    if (window.confirm('确定要开始下一局吗？这将重置玩家状态和记录，但保留玩家名单。')) {
      setPlayers(players.map(p => ({ ...p, isDead: false, role: null })));
      setLogs([]);
      setDayCount(1);
      setIsNight(true);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptViewer />;
      case 'grimoire':
        return (
          <SeatingChart
            players={players}
            setPlayers={setPlayers}
            onResetGame={resetGame}
            onNextGame={nextGame}
            addLog={addLog}
          />
        );
      case 'log':
        return (
          <GameLog
            logs={logs}
            setLogs={setLogs}
            dayCount={dayCount}
            setDayCount={setDayCount}
            isNight={isNight}
            setIsNight={setIsNight}
            addLog={addLog}
          />
        );
      default:
        return null;
    }
  };

  // Helper to get role distribution
  const getRoleDistribution = (count) => {
    if (count < 5) return null;
    if (count === 5) return { townsfolk: 3, outsider: 0, minion: 1, demon: 1 };
    if (count === 6) return { townsfolk: 3, outsider: 1, minion: 1, demon: 1 };
    if (count === 7) return { townsfolk: 5, outsider: 0, minion: 1, demon: 1 };
    if (count === 8) return { townsfolk: 5, outsider: 1, minion: 1, demon: 1 };
    if (count === 9) return { townsfolk: 5, outsider: 2, minion: 1, demon: 1 };
    if (count === 10) return { townsfolk: 7, outsider: 0, minion: 2, demon: 1 };
    if (count === 11) return { townsfolk: 7, outsider: 1, minion: 2, demon: 1 };
    if (count === 12) return { townsfolk: 7, outsider: 2, minion: 2, demon: 1 };
    if (count === 13) return { townsfolk: 9, outsider: 0, minion: 3, demon: 1 };
    if (count === 14) return { townsfolk: 9, outsider: 1, minion: 3, demon: 1 };
    if (count >= 15) return { townsfolk: 9, outsider: 2, minion: 3, demon: 1 };
    return null;
  };

  const openDistributionEditor = () => {
    const dist = customDistribution || getRoleDistribution(players.length);
    if (dist) {
      setEditingDistribution({ ...dist });
      setShowDistributionEditor(true);
    }
  };

  const saveDistribution = () => {
    setCustomDistribution(editingDistribution);
    setShowDistributionEditor(false);
  };

  const resetDistribution = () => {
    setCustomDistribution(null);
    setShowDistributionEditor(false);
  };

  const renderHeaderRight = () => {
    if (activeTab === 'grimoire') {
      const dist = customDistribution || getRoleDistribution(players.length);
      if (!dist) return null;
      return (
        <div
          onClick={openDistributionEditor}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: '2px 12px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            lineHeight: '1.2',
            justifyContent: 'start',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ color: '#2d5a8e', whiteSpace: 'nowrap' }}>镇民:{dist.townsfolk}</span>
          <span style={{ color: '#4a8db7', whiteSpace: 'nowrap' }}>外来:{dist.outsider}</span>
          <span style={{ color: '#9e2b25', whiteSpace: 'nowrap' }}>爪牙:{dist.minion}</span>
          <span style={{ color: '#8a0303', whiteSpace: 'nowrap' }}>恶魔:{dist.demon}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={setActiveTab} headerRight={renderHeaderRight()}>
        {renderContent()}
      </Layout>

      {/* Distribution Editor Modal */}
      {showDistributionEditor && editingDistribution && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDistributionEditor(false)}
        >
          <div
            style={{
              background: '#1a1a2e',
              border: '2px solid #d4af37',
              borderRadius: '16px',
              padding: '24px',
              minWidth: '280px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#d4af37', marginBottom: '16px', fontFamily: 'Cinzel, serif' }}>阵营人数配置</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ color: '#2d5a8e', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>镇民</label>
                <input
                  type="number"
                  min="0"
                  value={editingDistribution.townsfolk}
                  onChange={(e) => setEditingDistribution({ ...editingDistribution, townsfolk: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #2d5a8e',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#4a8db7', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>外来者</label>
                <input
                  type="number"
                  min="0"
                  value={editingDistribution.outsider}
                  onChange={(e) => setEditingDistribution({ ...editingDistribution, outsider: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #4a8db7',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#9e2b25', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>爪牙</label>
                <input
                  type="number"
                  min="0"
                  value={editingDistribution.minion}
                  onChange={(e) => setEditingDistribution({ ...editingDistribution, minion: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #9e2b25',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#8a0303', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>恶魔</label>
                <input
                  type="number"
                  min="0"
                  value={editingDistribution.demon}
                  onChange={(e) => setEditingDistribution({ ...editingDistribution, demon: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #8a0303',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={resetDistribution}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid #666',
                  borderRadius: '8px',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                重置为默认
              </button>
              <button
                onClick={saveDistribution}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#d4af37',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
