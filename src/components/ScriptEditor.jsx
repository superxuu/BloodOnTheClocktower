import React, { useState } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

const ScriptEditor = ({ script, onSave, onCancel }) => {
    const [editedScript, setEditedScript] = useState(JSON.parse(JSON.stringify(script)));
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

    const handleScriptChange = (field, value) => {
        setEditedScript(prev => ({ ...prev, [field]: value }));
    };

    const handleRoleChange = (roleId, field, value) => {
        setEditedScript(prev => ({
            ...prev,
            roles: prev.roles.map(r => r.id === roleId ? { ...r, [field]: value } : r)
        }));
    };

    const handleDeleteRole = (roleId) => {
        setConfirmDialog({
            isOpen: true,
            message: '确定要删除这个角色吗？',
            onConfirm: () => {
                setEditedScript(prev => ({
                    ...prev,
                    roles: prev.roles.filter(r => r.id !== roleId)
                }));
                setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
            }
        });
    };

    const handleAddRole = () => {
        const newRole = {
            id: `new_${Date.now()}`,
            name: '新角色',
            team: 'townsfolk',
            ability: '点击编辑能力',
            firstNight: false,
            otherNight: false
        };
        setEditedScript(prev => ({
            ...prev,
            roles: [...prev.roles, newRole]
        }));
    };

    const teams = [
        { id: 'townsfolk', name: '镇民', color: 'var(--team-townsfolk)' },
        { id: 'outsider', name: '外来者', color: 'var(--team-outsider)' },
        { id: 'minion', name: '爪牙', color: 'var(--team-minion)' },
        { id: 'demon', name: '恶魔', color: 'var(--team-demon)' }
    ];

    return (
        <>
            <div className="script-editor animate-fadeIn">
                <div className="glass-panel p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl text-gold">编辑剧本</h2>
                        <div className="flex gap-2">
                            <button onClick={onCancel} className="p-2 text-mist hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <button onClick={() => onSave(editedScript)} className="p-2 text-gold hover:bg-gold/10 rounded transition-colors">
                                <Save size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-mist mb-1">剧本名称</label>
                            <input
                                type="text"
                                value={editedScript.title}
                                onChange={(e) => handleScriptChange('title', e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded p-2 text-ghost outline-none focus:border-gold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-mist mb-1">作者</label>
                            <input
                                type="text"
                                value={editedScript.author || ''}
                                onChange={(e) => handleScriptChange('author', e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded p-2 text-ghost outline-none focus:border-gold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-mist mb-1">描述</label>
                            <textarea
                                value={editedScript.description || ''}
                                onChange={(e) => handleScriptChange('description', e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded p-2 text-ghost outline-none focus:border-gold h-20"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg text-gold">角色列表</h3>
                        <button onClick={handleAddRole} className="flex items-center gap-1 text-sm text-gold hover:bg-gold/10 px-2 py-1 rounded">
                            <Plus size={16} /> 添加角色
                        </button>
                    </div>

                    <div className="space-y-4">
                        {editedScript.roles.map((role, index) => (
                            <div key={role.id} className="bg-black/20 p-3 rounded border border-glass-border flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={role.name}
                                        onChange={(e) => handleRoleChange(role.id, 'name', e.target.value)}
                                        className="flex-1 bg-transparent border-b border-glass-border focus:border-gold outline-none text-ghost font-bold"
                                        placeholder="角色名称"
                                    />
                                    <select
                                        value={role.team}
                                        onChange={(e) => handleRoleChange(role.id, 'team', e.target.value)}
                                        className="bg-black/30 text-xs text-mist border border-glass-border rounded outline-none"
                                        style={{ color: teams.find(t => t.id === role.team)?.color }}
                                    >
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <textarea
                                    value={role.ability}
                                    onChange={(e) => handleRoleChange(role.id, 'ability', e.target.value)}
                                    className="w-full bg-transparent text-sm text-mist outline-none resize-none"
                                    rows={2}
                                    placeholder="能力描述"
                                />
                                <div className="flex gap-4 text-xs text-mist">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={role.firstNight}
                                            onChange={(e) => handleRoleChange(role.id, 'firstNight', e.target.checked)}
                                        /> 首夜唤醒
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={role.otherNight}
                                            onChange={(e) => handleRoleChange(role.id, 'otherNight', e.target.checked)}
                                        /> 每夜唤醒
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
            />
        </>
    );
};

export default ScriptEditor;
