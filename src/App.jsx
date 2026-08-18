import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Settings from './pages/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return window.location.hash || '#dashboard';
  });

  useEffect(() => {
    const onHashChange = () => setCurrentPage(window.location.hash || '#dashboard');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(hash) {
    window.location.hash = hash;
    setCurrentPage(hash);
  }

  function renderPage() {
    switch (currentPage) {
      case '#subjects': return <Subjects />;
      case '#settings': return <Settings />;
      default: return <Dashboard />;
    }
  }

  return (
    <AppProvider>
      {/* Background orbs */}
      <div className="bg-orb" style={{
        width: 600, height: 600, top: -200, left: -200,
        background: 'radial-gradient(circle, #8b5cf6, transparent)',
      }} />
      <div className="bg-orb" style={{
        width: 400, height: 400, bottom: 0, right: -100,
        background: 'radial-gradient(circle, #6366f1, transparent)',
      }} />

      <Navbar currentPage={currentPage} onNavigate={navigate} />

      {/* Main content area */}
      <main style={{
        marginLeft: 220,
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        paddingBottom: 32,
      }}>
        {renderPage()}
      </main>

      <style>{`
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding-bottom: 80px !important;
          }
        }
      `}</style>
    </AppProvider>
  );
}

export default App;
