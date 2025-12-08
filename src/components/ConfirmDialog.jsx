import React from 'react';
import { X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
            onClick={onCancel}
        >
            <div
                className="glass-panel"
                style={{
                    padding: '24px',
                    width: '100%',
                    maxWidth: '360px',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--color-gold)' }}>确认</h3>
                    <button
                        onClick={onCancel}
                        style={{ color: 'var(--color-mist)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <p style={{
                    color: 'var(--color-ghost)',
                    marginBottom: '24px',
                    lineHeight: '1.6',
                    fontSize: '14px'
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #666',
                            color: '#999',
                            background: 'rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(100,100,100,0.2)';
                            e.currentTarget.style.borderColor = '#888';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                            e.currentTarget.style.borderColor = '#666';
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-gold)',
                            color: 'var(--color-gold)',
                            background: 'rgba(212, 175, 55, 0.1)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                        }}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
