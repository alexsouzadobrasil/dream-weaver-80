import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAdminSecret, getAdminSecret } from '../../lib/adminApi';
import { useEffect } from 'react';

const navItems = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/dreams',    icon: '🌙', label: 'Sonhos' },
  { to: '/admin/users',     icon: '👥', label: 'Usuários' },
  { to: '/admin/donations', icon: '💳', label: 'Doações' },
  { to: '/admin/logs',      icon: '📋', label: 'Logs' },
  { to: '/admin/storage',   icon: '🗂️', label: 'Arquivos' },
  { to: '/admin/settings',  icon: '⚙️', label: 'Config' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAdminSecret()) navigate('/admin/login');
  }, [navigate]);

  function handleLogout() {
    clearAdminSecret();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <span className="font-bold text-white">Jerry Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <span>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
