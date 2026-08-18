import { GraduationCap, LayoutDashboard, BookOpen, Settings } from 'lucide-react';

const navItems = [
  { hash: '#dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { hash: '#subjects', icon: BookOpen, label: 'Môn học' },
  { hash: '#settings', icon: Settings, label: 'Cài đặt' },
];

export default function Navbar({ currentPage, onNavigate }) {
  return (
    <>
      {/* Desktop sidebar nav */}
      <nav className="desktop-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="nav-brand-title">GPA Pro</div>
            <div className="nav-brand-sub">Tính điểm thông minh</div>
          </div>
        </div>

        <div className="nav-items">
          {navItems.map(item => (
            <button
              key={item.hash}
              onClick={() => onNavigate(item.hash)}
              className={`nav-item ${currentPage === item.hash ? 'nav-item-active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-footer">
          <div className="nav-footer-text">Dữ liệu lưu cục bộ</div>
          <div className="nav-footer-dot"></div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {navItems.map(item => (
          <button
            key={item.hash}
            onClick={() => onNavigate(item.hash)}
            className={`mobile-nav-item ${currentPage === item.hash ? 'mobile-nav-item-active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .desktop-nav {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 220px;
          background: rgba(16, 16, 28, 0.95);
          border-right: 1px solid var(--border-color);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          z-index: 40;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 8px 28px;
        }
        .nav-brand-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 14px var(--glow-purple);
        }
        .nav-brand-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }
        .nav-brand-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          text-align: left;
          width: 100%;
        }
        .nav-item:hover {
          background: var(--bg-card);
          color: var(--text-secondary);
        }
        .nav-item-active {
          background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15)) !important;
          color: #a78bfa !important;
          border: 1px solid rgba(139,92,246,0.3);
        }
        .nav-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 8px 0;
          border-top: 1px solid var(--border-color);
        }
        .nav-footer-text {
          font-size: 11px;
          color: var(--text-muted);
        }
        .nav-footer-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-green);
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
          margin-left: auto;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
        /* Mobile nav */
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(16, 16, 28, 0.98);
          border-top: 1px solid var(--border-color);
          backdrop-filter: blur(20px);
          z-index: 40;
          padding: 8px 0 max(8px, env(safe-area-inset-bottom));
        }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .mobile-nav-item:hover, .mobile-nav-item-active {
          color: #a78bfa;
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none; }
          .mobile-nav { display: flex; }
        }
      `}</style>
    </>
  );
}
