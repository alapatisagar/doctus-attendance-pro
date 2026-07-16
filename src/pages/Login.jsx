import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  LockKeyhole,
  Mail,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const features = [
  { icon: Users, title: 'Employees', description: 'Manage employee details' },
  { icon: CalendarCheck2, title: 'Attendance', description: 'Track daily attendance' },
  { icon: Plane, title: 'Leaves', description: 'Manage leave requests' },
  { icon: BarChart3, title: 'Reports', description: 'Generate reports' },
  { icon: CalendarDays, title: 'Holidays', description: 'Company holiday calendar' },
  { icon: ShieldCheck, title: 'Secure', description: 'Firebase protected' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('doctus-remembered-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        const { registerWithEmail } = await import('../lib/firebase');
        await registerWithEmail(email, password);
      } else {
        await login(email, password);
      }
      if (rememberMe) {
        window.localStorage.setItem('doctus-remembered-email', email);
      } else {
        window.localStorage.removeItem('doctus-remembered-email');
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email to receive a password reset link.');
      return;
    }
    try {
      await resetPassword(email);
      setError('');
      window.alert('Password reset link sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Unable to send reset email');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,_#fffdf2_0%,_#fff7d6_45%,_#fff3e8_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-12 top-0 h-56 w-56 rounded-full bg-[#FFD400]/35 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-[#E60023]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#FF7A00]/20 blur-3xl" />
        <div className="absolute left-[20%] top-[15%] h-24 w-24 rotate-12 rounded-[2rem] border border-[#E60023]/20 bg-white/70 backdrop-blur-xl" />
        <div className="absolute bottom-[12%] right-[10%] h-32 w-32 rotate-[-20deg] rounded-full border border-[#FFD400]/40 bg-white/70 backdrop-blur-xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-7xl overflow-hidden rounded-[32px] border border-orange-100/70 bg-white/80 shadow-[0_40px_120px_-30px_rgba(230,0,35,0.3)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex flex-col justify-between bg-[linear-gradient(135deg,_rgba(255,212,0,0.95),_rgba(255,122,0,0.9)_60%,_rgba(255,255,255,0.96))] p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.55),_transparent_30%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E60023] shadow-sm">
              <Sparkles size={14} />
              DOCTUS BUSINESS SOLUTIONS
            </div>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#E60023]">Welcome to</p>
              <h1 className="max-w-lg text-4xl font-black leading-[0.95] text-slate-950 sm:text-5xl lg:text-6xl">
                DOCTUS
                <br />
                BUSINESS
                <br />
                SOLUTIONS
              </h1>
              <p className="max-w-lg text-base font-medium text-slate-700 sm:text-lg">
                Attendance Management System
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_35px_-20px_rgba(0,0,0,0.4)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#E60023]/10 p-2 text-[#E60023]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="text-xs text-slate-600">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#FFD400]/80 p-3 text-[#E60023] shadow-sm">
                <Users size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Team coordination</p>
                <p className="text-sm text-slate-600">Keep operations flowing from anywhere.</p>
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div className="space-y-2">
                <div className="h-2 w-24 rounded-full bg-[#FFD400]" />
                <div className="h-2 w-16 rounded-full bg-[#FF7A00]/80" />
                <div className="h-2 w-20 rounded-full bg-[#E60023]/70" />
              </div>
              <div className="flex -space-x-2">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#FFD400]" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#FF7A00]" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#E60023]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white/80 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_25px_70px_-28px_rgba(0,0,0,0.25)] sm:p-8">
            <div className="mb-7 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] shadow-lg shadow-[#E60023]/20">
                <LockKeyhole className="text-white" size={28} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">DOCTUS BUSINESS SOLUTIONS</h2>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#E60023]">Attendance Management System</p>
              <p className="mt-4 text-lg font-semibold text-slate-800">Welcome Back!</p>
              <p className="text-sm text-slate-600">Sign in to continue.</p>
            </div>

            <div className="mt-6 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] text-white shadow-sm' : 'text-slate-600'}`}
                onClick={() => setMode('login')}
                type="button"
              >
                Login
              </button>
              <button
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] text-white shadow-sm' : 'text-slate-600'}`}
                onClick={() => setMode('register')}
                type="button"
              >
                Register
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Mail size={16} className="text-[#E60023]" />
                  Email Address
                </span>
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                />
              </label>
              <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <LockKeyhole size={16} className="text-[#FF7A00]" />
                  Password
                </span>
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                />
              </label>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#E60023] focus:ring-[#E60023]" />
                  Remember Me
                </label>
                {mode === 'login' ? (
                  <button className="font-semibold text-[#E60023] transition hover:text-[#FF7A00]" type="button" onClick={handleReset}>
                    Forgot Password?
                  </button>
                ) : null}
              </div>

              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_55%,_#FFD400)] px-4 py-3.5 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                type="submit"
                disabled={loading}
              >
                <LockKeyhole size={18} />
                {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-[#FFD400]/40 bg-[linear-gradient(135deg,_rgba(255,212,0,0.12),_rgba(255,122,0,0.08))] p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck size={16} className="text-[#E60023]" />
                Secure • Reliable • Cloud Based
              </div>
              <p className="mt-1 text-sm text-slate-600">Data is protected with Firebase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
