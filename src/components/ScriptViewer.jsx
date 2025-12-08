import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import scriptsData from '../data/scripts.json';
import { ChevronDown, ChevronUp, Search, Upload, Loader, Edit, Trash2, FileText, X } from 'lucide-react';
import { parseScriptFromText, recognizeScript } from '../utils/ocr';
import { supabase } from '../lib/supabase';
import ScriptEditor from './ScriptEditor';
import ConfirmDialog from './ConfirmDialog';

const ScriptViewer = () => {
    const [scripts, setScripts] = useState(scriptsData);
    const [selectedScript, setSelectedScript] = useState(null);
    const [expandedRole, setExpandedRole] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [showTextImport, setShowTextImport] = useState(false);
    const [textToImport, setTextToImport] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

    // Default to the first script if available
    useEffect(() => {
        if (scripts.length > 0 && !selectedScript) {
            setSelectedScript(scripts[0]);
        }
    }, [scripts]);

    // Fetch scripts from Supabase
    useEffect(() => {
        const fetchRemoteScripts = async () => {
            if (!supabase) return;

            const { data, error } = await supabase
                .from('scripts')
                .select('*, roles(*)');

            if (error) {
                console.error('Error fetching scripts:', error);
                return;
            }

            if (data) {
                const formattedScripts = data.map(s => ({
                    ...s,
                    roles: s.roles.map(r => ({
                        ...r,
                        firstNight: r.first_night,
                        otherNight: r.other_night
                    }))
                }));

                setScripts(prev => {
                    const existingIds = new Set(prev.map(s => s.id));
                    const existingTitles = new Set(prev.map(s => s.title));

                    const newScripts = formattedScripts.filter(s =>
                        !existingIds.has(s.id) && !existingTitles.has(s.title)
                    );
                    return [...prev, ...newScripts];
                });
            }
        };

        fetchRemoteScripts();
    }, []);

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

            // Upload to Supabase if available
            if (supabase) {
                try {
                    // Insert script
                    const { data: scriptData, error: scriptError } = await supabase
                        .from('scripts')
                        .insert([{
                            title: newScript.title,
                            author: newScript.author,
                            description: newScript.description,
                            type: 'custom'
                        }])
                        .select()
                        .single();

                    if (scriptError) throw scriptError;

                    // Insert roles
                    const rolesToInsert = newScript.roles.map(role => ({
                        script_id: scriptData.id,
                        name: role.name,
                        team: role.team,
                        ability: role.ability,
                        first_night: role.firstNight,
                        other_night: role.otherNight
                    }));

                    const { error: rolesError } = await supabase
                        .from('roles')
                        .insert(rolesToInsert);

                    if (rolesError) throw rolesError;

                    // Use the server-generated ID
                    const completeScript = {
                        ...newScript,
                        id: scriptData.id,
                        roles: newScript.roles // Keep local roles structure
                    };

                    setScripts(prev => [...prev, completeScript]);
                    setSelectedScript(completeScript);
                    alert('剧本已上传并分享给所有人！');
                } catch (err) {
                    console.error('Upload failed:', err);
                    alert('上传到云端失败，仅本地保存');
                    setScripts(prev => [...prev, newScript]);
                    setSelectedScript(newScript);
                }
            } else {
                setScripts(prev => [...prev, newScript]);
                setSelectedScript(newScript);
            }
        } catch (error) {
            console.error(error);
            alert('识别失败，请重试');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSaveScript = async (editedScript) => {
        // Optimistic update locally
        setScripts(prev => prev.map(s => s.id === editedScript.id ? editedScript : s));
        setSelectedScript(editedScript);
        setIsEditing(false);

        if (supabase && editedScript.type === 'custom') {
            try {
                // Update script details
                const { error: scriptError } = await supabase
                    .from('scripts')
                    .update({
                        title: editedScript.title,
                        author: editedScript.author,
                        description: editedScript.description
                    })
                    .eq('id', editedScript.id);

                if (scriptError) throw scriptError;

                // Update roles (Delete all and re-insert is simplest for now)
                // Note: In a real app, we might want to be smarter to preserve IDs, 
                // but for this simple editor, re-creating roles ensures sync.
                // However, deleting requires RLS policy update.
                // Let's try to upsert or just warn if delete fails.

                // First, delete existing roles
                const { error: deleteError } = await supabase
                    .from('roles')
                    .delete()
                    .eq('script_id', editedScript.id);

                if (deleteError) {
                    console.warn('Delete roles failed (likely RLS), trying to update individually might be needed or policy update.', deleteError);
                    // If delete fails, we can't easily sync removals without more complex logic.
                    // For now, let's assume the user will run the policy update script.
                    throw deleteError;
                }

                // Insert new roles
                const rolesToInsert = editedScript.roles.map(role => ({
                    script_id: editedScript.id,
                    name: role.name,
                    team: role.team,
                    ability: role.ability,
                    first_night: role.firstNight,
                    other_night: role.otherNight
                }));

                const { error: insertError } = await supabase
                    .from('roles')
                    .insert(rolesToInsert);

                if (insertError) throw insertError;

                alert('剧本已更新并同步到云端！');
            } catch (error) {
                console.error('Update failed:', error);
                alert('云端同步失败：请确保你已更新数据库策略允许删除/修改操作。\n本地已保存。');
            }
        }
    }


    const handleDeleteScript = async () => {
        setConfirmDialog({
            isOpen: true,
            message: `确定要删除剧本 "${selectedScript.title}" 吗？此操作无法撤销。`,
            onConfirm: async () => {
                setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
                const scriptId = selectedScript.id;

                // Optimistic update: Remove from local state immediately
                setScripts(prev => {
                    const newScripts = prev.filter(s => s.id !== scriptId);
                    // Switch to another script if available
                    if (newScripts.length > 0) {
                        setSelectedScript(newScripts[0]);
                    } else {
                        setSelectedScript(null);
                    }
                    return newScripts;
                });

                if (supabase && selectedScript.type === 'custom') {
                    try {
                        // Delete script
                        const { data, error } = await supabase
                            .from('scripts')
                            .delete()
                            .eq('id', scriptId)
                            .select();

                        if (error) throw error;

                        if (data.length === 0) {
                            throw new Error('没有权限删除此剧本或剧本不存在 (请确保你运行了数据库策略更新脚本)');
                        }

                        alert('剧本已删除。');
                    } catch (error) {
                        console.error('Delete failed:', error);
                        alert(`删除失败: ${error.message || '未知错误'}`);
                        // Revert optimistic update if needed (reload page or fetch)
                        window.location.reload();
                    }
                }
            }
        });
    };

    const handleTextImport = async () => {
        if (!textToImport.trim()) return;

        try {
            const newScript = parseScriptFromText(textToImport);

            // Upload logic (duplicated from file upload, could be refactored)
            if (supabase) {
                try {
                    // Insert script
                    const { data: scriptData, error: scriptError } = await supabase
                        .from('scripts')
                        .insert([{
                            title: newScript.title,
                            author: newScript.author,
                            description: newScript.description,
                            type: 'custom'
                        }])
                        .select()
                        .single();

                    if (scriptError) throw scriptError;

                    // Insert roles
                    const rolesToInsert = newScript.roles.map(role => ({
                        script_id: scriptData.id,
                        name: role.name,
                        team: role.team,
                        ability: role.ability,
                        first_night: role.firstNight,
                        other_night: role.otherNight
                    }));

                    const { error: rolesError } = await supabase
                        .from('roles')
                        .insert(rolesToInsert);

                    if (rolesError) throw rolesError;

                    const completeScript = {
                        ...newScript,
                        id: scriptData.id,
                        roles: newScript.roles
                    };

                    setScripts(prev => [...prev, completeScript]);
                    setSelectedScript(completeScript);
                    alert(`成功导入 ${newScript.roles.length} 个角色！`);
                } catch (err) {
                    console.error('Upload failed:', err);
                    alert('上传到云端失败，仅本地保存');
                    setScripts(prev => [...prev, newScript]);
                    setSelectedScript(newScript);
                }
            } else {
                setScripts(prev => [...prev, newScript]);
                setSelectedScript(newScript);
            }

            setShowTextImport(false);
            setTextToImport('');
        } catch (error) {
            console.error(error);
            alert(`解析失败: ${error.message}`);
        }
    };

    if (!selectedScript) return <div className="text-center p-4">Loading scripts...</div>;

    if (isEditing) {
        return <ScriptEditor script={selectedScript} onSave={handleSaveScript} onCancel={() => setIsEditing(false)} />;
    }

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

    const content = (
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

                    <div className="flex gap-2 items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTextImport(true);
                            }}
                            className="bg-transparent border-none outline-none text-mist hover:text-gold transition-colors cursor-pointer relative z-10 p-1"
                            title="粘贴文本导入"
                            type="button"
                        >
                            <FileText size={20} />
                        </button>
                        <label className="cursor-pointer text-mist hover:text-gold transition-colors" title="上传图片导入">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                            {isImporting ? <Loader size={20} className="animate-spin" /> : <Upload size={20} />}
                        </label>
                    </div>
                </div>

                {/* Text Import Modal */}
                {
                    showTextImport && createPortal(
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 99999,
                                backdropFilter: 'blur(4px)'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Optional: click outside to close
                                // setShowTextImport(false); 
                            }}
                        >
                            <div className="glass-panel p-6 w-full max-w-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setShowTextImport(false)}
                                    className="absolute top-4 right-4 text-mist hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                                <h3 className="text-xl text-gold mb-4">粘贴文本导入</h3>
                                <p className="text-sm text-mist mb-4">
                                    如果图片识别效果不佳，可以使用微信/QQ截图提取文字，然后粘贴到这里。
                                    系统会自动识别其中的角色。
                                </p>
                                <textarea
                                    className="w-full flex-1 min-h-[400px] bg-black/30 border border-glass-border rounded-lg p-4 text-ghost outline-none resize-none mb-6 focus:border-gold/50 transition-colors font-mono text-sm leading-relaxed"
                                    placeholder="在此粘贴剧本文字...
例如：
洗衣妇
图书管理员
调查员
..."
                                    value={textToImport}
                                    onChange={(e) => setTextToImport(e.target.value)}
                                />
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setShowTextImport(false)}
                                        className="bg-transparent border-none outline-none text-mist hover:text-gold transition-colors px-4 py-2"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleTextImport}
                                        className="bg-transparent text-gold border border-gold/50 hover:border-gold hover:bg-gold/10 px-6 py-2 rounded transition-all outline-none"
                                    >
                                        开始识别
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }

                {
                    isImporting && (
                        <div className="w-full bg-gray-700 h-1 rounded mb-2 overflow-hidden">
                            <div className="bg-gold h-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                        </div>
                    )
                }

                <h2 className="text-xl text-gold mb-1 flex items-center justify-center gap-2">
                    {selectedScript.title}
                    {selectedScript.type === 'custom' && (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(true)} className="text-stone-500 hover:text-gold transition-colors" title="编辑剧本">
                                <Edit size={16} />
                            </button>
                            {/* Only allow deleting if it's not a local hardcoded script */}
                            {!scriptsData.find(s => s.id === selectedScript.id) && (
                                <button onClick={handleDeleteScript} className="text-stone-500 hover:text-red-500 transition-colors" title="删除剧本">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </h2>
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
            {
                Object.entries(groupedRoles).map(([team, roles]) => {
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
                })
            }
        </div>
    );

    return (
        <>
            {content}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
            />
        </>
    );
};

export default ScriptViewer;
