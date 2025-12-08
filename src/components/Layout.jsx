import React from 'react';
import { BookOpen, Users, ScrollText } from 'lucide-react';

const Layout = ({ children, activeTab, onTabChange, headerRight }) => {
    return (
        <div className="app-container">
            {/* Header */}
            <header className="header glass-panel">
                <h1 style={{ fontSize: '1.25rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Blood on the Clocktower</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {headerRight}
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav glass-panel">
                <div className="nav-inner">
                    <NavButton
                        icon={<BookOpen size={24} />}
                        label="剧本"
                        isActive={activeTab === 'script'}
                        onClick={() => onTabChange('script')}
                    />
                    <NavButton
                        icon={<Users size={24} />}
                        label="魔典"
                        isActive={activeTab === 'grimoire'}
                        onClick={() => onTabChange('grimoire')}
                    />
                    <NavButton
                        icon={<ScrollText size={24} />}
                        label="记录"
                        isActive={activeTab === 'log'}
                        onClick={() => onTabChange('log')}
                    />
                </div>
            </nav>
        </div>
    );
};

const NavButton = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`nav-btn ${isActive ? 'active' : ''}`}
    >
        <div className="icon-wrapper">
            {icon}
        </div>
        <span className="nav-label">{label}</span>
    </button>
);

export default Layout;
