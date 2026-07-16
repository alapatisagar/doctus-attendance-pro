import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BellRing,
  Building2,
  CalendarDays,
  CircleUserRound,
  LogOut,
  Plane,
  Search,
  Settings,
  Sparkles,
  SunMedium,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { fetchAllData } from '../lib/firestoreService';

const links = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/employees', label: 'Employees', icon: UsersRound },
  { to: '/attendance', label: 'Attendance', icon: CalendarDays },
  { to: '/leaves', label: 'Leaves', icon: Plane },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [companyProfile, setCompanyProfile] = useState({ companyName: 'Doctus Business Solutions', companyLogo: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchAllData();
        setCompanyProfile(result.settings || { companyName: 'Doctus Business Solutions', companyLogo: '' });
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

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#fff9e6_0%,_#fffef8_55%,_#fff3d6_100%)] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-[32px] border border-[#FFD400]/35 bg-white/80 shadow-[0_35px_120px_-35px_rgba(230,0,35,0.25)] backdrop-blur-xl lg:flex-row">
        <aside className="w-full border-b border-[#E60023]/10 bg-[linear-gradient(180deg,_#FFD400_0%,_#FFC800_35%,_#FFF7CC_100%)] p-5 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-7 rounded-[24px] border border-white/50 bg-white/70 p-4 shadow-[0_12px_35px_-18px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_55%,_#FFD400)] shadow-lg shadow-[#E60023]/20">
                <Building2 className="text-white" size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E60023]">Doctus</p>
                <h1 className="text-lg font-black text-slate-900">{companyProfile.companyName || 'Business Solutions'}</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">Premium HRMS workspace for modern teams</p>
          </div>

          <nav className="space-y-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${isActive ? 'bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] text-white shadow-lg shadow-[#E60023]/20' : 'text-slate-800 hover:bg-white/60 hover:text-[#E60023]'}`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[0_16px_45px_-22px_rgba(0,0,0,0.3)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#FFF3D6] p-2 text-[#E60023]">
                <CircleUserRound size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.displayName || user?.email || 'HR Admin'}</p>
                <p className="text-xs text-slate-600">Operations Lead</p>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E60023]/20 bg-[#FFF3D6] px-3 py-2 text-sm font-semibold text-[#E60023] transition hover:-translate-y-0.5">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-[linear-gradient(135deg,_rgba(255,255,255,0.97),_rgba(255,249,230,0.97))] p-4 sm:p-6 lg:p-7">
          <header className="mb-6 rounded-[24px] border border-[#FFD400]/35 bg-white/80 p-4 shadow-[0_16px_45px_-22px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E60023]">Operations Center</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Welcome back to your attendance command center</h2>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-0">
              <label className="flex items-center gap-2 rounded-2xl border border-[#FFD400]/30 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-600 shadow-sm">
                <Search size={16} className="text-[#FF7A00]" />
                <input className="w-28 bg-transparent outline-none sm:w-40" placeholder="Search" />
              </label>
              <button className="flex items-center gap-2 rounded-2xl border border-[#FFD400]/30 bg-[#FFF9E6] px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <BellRing size={16} className="text-[#E60023]" />
                Alerts
              </button>
              <button className="flex items-center gap-2 rounded-2xl border border-[#FFD400]/30 bg-[#FFF9E6] px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <SunMedium size={16} className="text-[#FF7A00]" />
                Bright Mode
              </button>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
