import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaChartPie, FaCog, FaFileAlt, FaMoon, FaSignOutAlt, FaSun, FaUsers } from 'react-icons/fa';
import { useAuth } from '../lib/auth';
import { fetchAllData } from '../lib/firestoreService';

const links = [
  { to: '/', label: 'Dashboard', icon: FaChartPie },
  { to: '/employees', label: 'Employees', icon: FaUsers },
  { to: '/attendance', label: 'Attendance', icon: FaCalendarAlt },
  { to: '/leaves', label: 'Leave', icon: FaFileAlt },
  { to: '/reports', label: 'Reports', icon: FaFileAlt },
  { to: '/settings', label: 'Settings', icon: FaCog },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('doctus-theme') || 'dark');
  const [companyProfile, setCompanyProfile] = useState({ companyName: 'Doctus Attendance Pro', companyLogo: '' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('doctus-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchAllData();
        setCompanyProfile(result.settings || { companyName: 'Doctus Attendance Pro', companyLogo: '' });
      } catch (error) {
        console.error(error);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const shellClasses = theme === 'light'
    ? 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_20%),linear-gradient(135deg,_#f8fafc,_#e2e8f0)] text-slate-900'
    : 'bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_30%),linear-gradient(135deg,_#020617,_#111827)] text-slate-100';

  return (
    <div className={`min-h-screen p-3 sm:p-6 ${shellClasses}`}>
      <div className={`mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl lg:flex-row ${theme === 'light' ? 'bg-white/80' : 'bg-slate-950/70'}`}>
        <aside className={`w-full border-b p-5 lg:w-72 lg:border-b-0 lg:border-r ${theme === 'light' ? 'border-slate-200 bg-white/70' : 'border-white/10 bg-slate-900/70'}`}>
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-500">Doctus</p>
            <h1 className="mt-2 text-2xl font-semibold">{companyProfile.companyName || 'Attendance Pro'}</h1>
            <p className={`mt-2 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>HRMS workspace for modern teams</p>
          </div>
          <nav className="space-y-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-cyan-500/20 text-cyan-600 shadow-lg shadow-cyan-950/10' : theme === 'light' ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
                }
              >
                <Icon className="text-base" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className={`mt-10 rounded-2xl border p-4 ${theme === 'light' ? 'border-cyan-200 bg-cyan-50' : 'border-cyan-400/20 bg-cyan-500/10'}`}>
            <p className={`text-sm ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-200'}`}>Signed in as</p>
            <p className="mt-1 font-semibold">{user?.displayName || user?.email || 'HR Admin'}</p>
            <button onClick={handleLogout} className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${theme === 'light' ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100' : 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/20'}`}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className={`mb-6 flex flex-col gap-3 rounded-[1.5rem] border p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between ${theme === 'light' ? 'border-slate-200 bg-white/70' : 'border-white/10 bg-white/10'}`}>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-500">Operations Center</p>
              <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Welcome back to your attendance command center</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${theme === 'light' ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-white/10 bg-white/10 text-slate-100'}`}>
                {theme === 'light' ? <FaMoon /> : <FaSun />} {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
              <div className={`rounded-2xl border px-4 py-2 text-sm ${theme === 'light' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>
                99.2% workforce readiness
              </div>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
