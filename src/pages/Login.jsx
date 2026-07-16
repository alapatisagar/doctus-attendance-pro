import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../lib/auth';

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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.35),_transparent_30%),linear-gradient(135deg,_#020617,_#111827)] px-4 py-8 text-slate-100">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between bg-gradient-to-br from-cyan-500/20 to-violet-500/10 p-8 sm:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Doctus Attendance Pro</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Secure staff attendance workflows in one place.</h1>
            <p className="mt-4 max-w-md text-base text-slate-300 sm:text-lg">
              Manage employees, attendance, leaves, reports, and holidays with Firebase Authentication, Firestore, and Storage.
            </p>
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Admin access</p>
            <p className="mt-2">Configure VITE_ADMIN_EMAILS in your environment to enable admin-only sign-in.</p>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <FaUserCircle className="text-3xl text-cyan-300" />
            <div>
              <h2 className="text-2xl font-semibold text-white">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
              <p className="text-sm text-slate-400">Use your Firebase email and password</p>
            </div>
          </div>
          <div className="mb-4 flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button className={`flex-1 rounded-xl px-3 py-2 text-sm ${mode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`} onClick={() => setMode('login')} type="button">Login</button>
            <button className={`flex-1 rounded-xl px-3 py-2 text-sm ${mode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`} onClick={() => setMode('register')} type="button">Register</button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block rounded-2xl border border-white/10 bg-white/5 p-3">
              <span className="text-sm text-slate-400">Email</span>
              <input className="mt-1 w-full bg-transparent outline-none" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label className="block rounded-2xl border border-white/10 bg-white/5 p-3">
              <span className="text-sm text-slate-400">Password</span>
              <input className="mt-1 w-full bg-transparent outline-none" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              Remember login
            </label>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
              <FaLock /> {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          {mode === 'login' ? (
            <button className="mt-3 text-sm text-cyan-300" type="button" onClick={handleReset}>Forgot password?</button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
