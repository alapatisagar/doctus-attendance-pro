import { useEffect, useState } from 'react';
import { FaSave, FaPlus } from 'react-icons/fa';
import { useAuth } from '../lib/auth';
import { fetchAllData, saveHoliday, saveSettings } from '../lib/firestoreService';

const emptyHoliday = { title: '', date: '', type: 'National' };
const defaultSettings = {
  companyName: 'Doctus Attendance Pro',
  companyLogo: '',
  workHours: 8,
  weekStart: 'Monday',
  timezone: 'UTC',
  theme: 'Midnight Glow',
  officeStart: '09:00',
  officeEnd: '18:00',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  attendanceRules: 'Standard attendance policy with punctuality and leave compliance.',
};

const Settings = () => {
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], holidays: [], settings: {} });
  const [form, setForm] = useState(defaultSettings);
  const [holidayForm, setHolidayForm] = useState(emptyHoliday);
  const [profileForm, setProfileForm] = useState({ displayName: '', photoURL: '' });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchAllData();
        setData(result);
        setForm({ ...defaultSettings, ...(result.settings || {}) });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setProfileForm({ displayName: user?.displayName || '', photoURL: user?.photoURL || '' });
  }, [user]);

  const handleWorkingDayToggle = (day) => {
    const nextDays = form.workingDays.includes(day) ? form.workingDays.filter((value) => value !== day) : [...form.workingDays, day];
    setForm({ ...form, workingDays: nextDays });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await saveSettings(form);
      const refreshed = await fetchAllData();
      setData(refreshed);
      setForm({ ...defaultSettings, ...(refreshed.settings || {}) });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleHolidaySubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await saveHoliday({ id: `holiday-${Date.now()}`, ...holidayForm });
      const refreshed = await fetchAllData();
      setData(refreshed);
      setHolidayForm(emptyHoliday);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback('');
    try {
      await updateProfile(profileForm.displayName, profileForm.photoURL);
      setFeedback('Profile updated successfully.');
    } catch (error) {
      setFeedback(error.message || 'Unable to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">Organization configuration</h3>
          <p className="mt-2 text-sm text-slate-400">Control attendance defaults, office timing, and workplace preferences.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-400">Company name</p>
              <p className="font-semibold text-white">{form.companyName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-400">Office hours</p>
              <p className="font-semibold text-white">{form.officeStart} – {form.officeEnd}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-400">Working days</p>
              <p className="font-semibold text-white">{form.workingDays.join(', ')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">Holiday calendar</h3>
          <form onSubmit={handleHolidaySubmit} className="mt-4 space-y-3">
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Holiday title" value={holidayForm.title} onChange={(event) => setHolidayForm({ ...holidayForm, title: event.target.value })} required />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="date" value={holidayForm.date} onChange={(event) => setHolidayForm({ ...holidayForm, date: event.target.value })} required />
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={holidayForm.type} onChange={(event) => setHolidayForm({ ...holidayForm, type: event.target.value })}>
              <option value="National">National</option>
              <option value="Company">Company</option>
              <option value="Regional">Regional</option>
            </select>
            <button className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
              <FaPlus /> Add holiday
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {data.holidays.map((holiday) => (
              <div key={holiday.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{holiday.title}</span>
                  <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-100">{holiday.type}</span>
                </div>
                <p className="mt-1">{holiday.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white">Customize settings</h3>
        <div className="mt-4 grid gap-3">
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.companyLogo} onChange={(event) => setForm({ ...form, companyLogo: event.target.value })} placeholder="Company logo URL" />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="number" value={form.workHours} onChange={(event) => setForm({ ...form, workHours: Number(event.target.value) })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.weekStart} onChange={(event) => setForm({ ...form, weekStart: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.officeStart} onChange={(event) => setForm({ ...form, officeStart: event.target.value })} />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.officeEnd} onChange={(event) => setForm({ ...form, officeEnd: event.target.value })} />
          </div>
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} />
          <textarea className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" rows="3" value={form.attendanceRules} onChange={(event) => setForm({ ...form, attendanceRules: event.target.value })} />
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="mb-2 text-sm text-slate-400">Working days</p>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={form.workingDays.includes(day)} onChange={() => handleWorkingDayToggle(day)} />
                  {day}
                </label>
              ))}
            </div>
          </div>
          {form.companyLogo ? <img src={form.companyLogo} alt="Company logo preview" className="h-16 w-16 rounded-xl object-contain" /> : null}
        </div>
        <button className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
          <FaSave /> Save preferences
        </button>
      </form>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl lg:col-span-2">
        <h3 className="text-lg font-semibold text-white">Profile settings</h3>
        <p className="mt-2 text-sm text-slate-400">Keep the workspace identity aligned with your HR admin profile.</p>
        <form onSubmit={handleProfileSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} placeholder="Display name" />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={profileForm.photoURL} onChange={(event) => setProfileForm({ ...profileForm, photoURL: event.target.value })} placeholder="Profile image URL" />
          <div className="md:col-span-2">
            {feedback ? <p className="mb-2 text-sm text-cyan-200">{feedback}</p> : null}
            <button className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
              <FaSave /> Update profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
