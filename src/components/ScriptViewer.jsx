import React, { useState, useEffect } from 'react';
import scriptsData from '../data/scripts.json';
import { ChevronDown, ChevronUp, Search, Upload, Loader } from 'lucide-react';
import { recognizeScript } from '../utils/ocr';

const ScriptViewer = () => {
    const [scripts, setScripts] = useState(scriptsData);
    const [selectedScript, setSelectedScript] = useState(null);
    const [expandedRole, setExpandedRole] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    // Default to the first script if available
    useEffect(() => {
        if (scripts.length > 0 && !selectedScript) {
            setSelectedScript(scripts[0]);
        }
    }, [scripts]);

    const toggleRole = (roleId) => {
        if (expandedRole === roleId) {
            setExpandedRole(null);
        } else {
            setExpandedRole(roleId);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setImportProgress(0);

        try {
            const newScript = await recognizeScript(file, (progress) => {
                setImportProgress(Math.round(progress * 100));
            });

            setScripts([...scripts, newScript]);
            setSelectedScript(newScript);
        } catch (error) {
            console.error(error);
            alert('识别失败，请重试');
        } finally {
            setIsImporting(false);
        }
    };

    if (!selectedScript) return <div className="text-center p-4">Loading scripts...</div>;

    const roles = selectedScript.roles || [];
    const groupedRoles = {
        townsfolk: roles.filter(r => r.team === 'townsfolk'),
        outsider: roles.filter(r => r.team === 'outsider'),
        minion: roles.filter(r => r.team === 'minion'),
        demon: roles.filter(r => r.team === 'demon'),
    };

    const teamNames = {
        townsfolk: '镇民 (Townsfolk)',
        outsider: '外来者 (Outsider)',
        minion: '爪牙 (Minion)',
        demon: '恶魔 (Demon)',
    };

    return (
        <div className="script-viewer">
            {/* Script Header */}
            <div className="glass-panel p-4 mb-4 text-center relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <select
                        className="bg-black/30 text-gold border border-glass-border rounded p-1 text-sm outline-none"
                        value={selectedScript.id}
                        onChange={(e) => setSelectedScript(scripts.find(s => s.id === e.target.value))}
                    >
                        {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>

                    <label className="cursor-pointer text-mist hover:text-gold transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                        {isImporting ? <Loader size={20} className="animate-spin" /> : <Upload size={20} />}
                    </label>
                </div>

                {isImporting && (
                    <div className="w-full bg-gray-700 h-1 rounded mb-2 overflow-hidden">
                        <div className="bg-gold h-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                    </div>
                )}

                <h2 className="text-xl text-gold mb-1">{selectedScript.title}</h2>
                <p className="text-xs text-mist italic">{selectedScript.author}</p>
                <p className="text-sm mt-2 text-ghost">{selectedScript.description}</p>
            </div>

            {/* Search Bar */}
            <div className="glass-panel p-2 mb-4 flex items-center">
                <Search size={18} className="text-mist ml-2" />
                <input
                    type="text"
                    placeholder="搜索角色..."
                    className="bg-transparent border-none outline-none text-ghost ml-2 w-full placeholder-mist"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Role Lists */}
            {Object.entries(groupedRoles).map(([team, roles]) => {
                const filteredRoles = roles.filter(r => r.name.includes(searchTerm));
                if (filteredRoles.length === 0) return null;

                return (
                    <div key={team} className="mb-6">
                        <h3
                            className="text-lg mb-3 border-b border-glass-border pb-1"
                            style={{ color: `var(--team-${team})` }}
                        >
                            {teamNames[team]}
                        </h3>
                        <div className="grid gap-3">
                            {filteredRoles.map(role => (
                                <div
                                    key={role.id}
                                    className="glass-panel p-3 transition-all duration-300"
                                    onClick={() => toggleRole(role.id)}
                                    style={{
                                        borderLeft: `4px solid var(--team-${team})`,
                                        cursor: 'pointer',
                                        background: expandedRole === role.id ? 'rgba(255,255,255,0.05)' : 'var(--glass-bg)'
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-ghost">{role.name}</span>
                                        {expandedRole === role.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>

                                    {expandedRole === role.id && (
                                        <div className="mt-3 text-sm text-mist animate-fadeIn">
                                            <p>{role.ability}</p>
                                            <div className="mt-2 flex gap-2">
                                                {role.firstNight && <span className="text-xs border border-mist rounded px-1">首夜唤醒</span>}
                                                {role.otherNight && <span className="text-xs border border-mist rounded px-1">每夜唤醒</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ScriptViewer;
