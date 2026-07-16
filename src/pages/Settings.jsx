import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Save } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { fetchAllData, saveHoliday, saveSettings } from '../lib/firestoreService';

const emptyHoliday = { title: '', date: '', type: 'National' };
const defaultSettings = {
  companyName: 'Doctus Business Solutions',
  companyLogo: '',
  workHours: 8,
  weekStart: 'Monday',
  timezone: 'UTC',
  theme: 'Bright Enterprise',
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
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <h3 className="text-lg font-black text-slate-900">Organization configuration</h3>
          <p className="mt-2 text-sm text-slate-600">Control attendance defaults, office timing, and workplace preferences.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3">
              <p className="text-sm font-semibold text-slate-600">Company name</p>
              <p className="mt-1 font-semibold text-slate-900">{form.companyName}</p>
            </div>
            <div className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3">
              <p className="text-sm font-semibold text-slate-600">Office hours</p>
              <p className="mt-1 font-semibold text-slate-900">{form.officeStart} – {form.officeEnd}</p>
            </div>
            <div className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3">
              <p className="text-sm font-semibold text-slate-600">Working days</p>
              <p className="mt-1 font-semibold text-slate-900">{form.workingDays.join(', ')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <h3 className="text-lg font-black text-slate-900">Holiday calendar</h3>
          <form onSubmit={handleHolidaySubmit} className="mt-4 space-y-3">
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Holiday title</span>
              <input className="w-full bg-transparent outline-none" value={holidayForm.title} onChange={(event) => setHolidayForm({ ...holidayForm, title: event.target.value })} required />
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Date</span>
              <input className="w-full bg-transparent outline-none" type="date" value={holidayForm.date} onChange={(event) => setHolidayForm({ ...holidayForm, date: event.target.value })} required />
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Type</span>
              <select className="w-full bg-transparent outline-none" value={holidayForm.type} onChange={(event) => setHolidayForm({ ...holidayForm, type: event.target.value })}>
                <option value="National">National</option>
                <option value="Company">Company</option>
                <option value="Regional">Regional</option>
              </select>
            </label>
            <button className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5" type="submit" disabled={loading}>
              <Plus size={16} /> Add holiday
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {data.holidays.map((holiday) => (
              <div key={holiday.id} className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{holiday.title}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#E60023]">{holiday.type}</span>
                </div>
                <p className="mt-1">{holiday.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
        <h3 className="text-lg font-black text-slate-900">Customize settings</h3>
        <div className="mt-4 grid gap-3">
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Company name</span>
            <input className="w-full bg-transparent outline-none" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
          </label>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Company logo URL</span>
            <input className="w-full bg-transparent outline-none" value={form.companyLogo} onChange={(event) => setForm({ ...form, companyLogo: event.target.value })} placeholder="Company logo URL" />
          </label>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Work hours</span>
            <input className="w-full bg-transparent outline-none" type="number" value={form.workHours} onChange={(event) => setForm({ ...form, workHours: Number(event.target.value) })} />
          </label>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Week start</span>
            <input className="w-full bg-transparent outline-none" value={form.weekStart} onChange={(event) => setForm({ ...form, weekStart: event.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Office start</span>
              <input className="w-full bg-transparent outline-none" value={form.officeStart} onChange={(event) => setForm({ ...form, officeStart: event.target.value })} />
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Office end</span>
              <input className="w-full bg-transparent outline-none" value={form.officeEnd} onChange={(event) => setForm({ ...form, officeEnd: event.target.value })} />
            </label>
          </div>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Timezone</span>
            <input className="w-full bg-transparent outline-none" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
          </label>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Theme</span>
            <input className="w-full bg-transparent outline-none" value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} />
          </label>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Attendance rules</span>
            <textarea className="w-full bg-transparent outline-none" rows="3" value={form.attendanceRules} onChange={(event) => setForm({ ...form, attendanceRules: event.target.value })} />
          </label>
          <div className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3">
            <p className="mb-2 text-sm font-semibold text-slate-600">Working days</p>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-full border border-[#FFD400]/20 bg-white px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.workingDays.includes(day)} onChange={() => handleWorkingDayToggle(day)} />
                  {day}
                </label>
              ))}
            </div>
          </div>
          {form.companyLogo ? <img src={form.companyLogo} alt="Company logo preview" className="h-16 w-16 rounded-2xl object-contain" /> : null}
        </div>
        <button className="mt-4 flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5" type="submit" disabled={loading}>
          <Save size={16} /> Save preferences
        </button>
      </form>

      <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)] lg:col-span-2">
        <h3 className="text-lg font-black text-slate-900">Profile settings</h3>
        <p className="mt-2 text-sm text-slate-600">Keep the workspace identity aligned with your HR admin profile.</p>
        <form onSubmit={handleProfileSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Display name</span>
            <input className="w-full bg-transparent outline-none" value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} placeholder="Display name" />
          </label>
          <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
            <span className="mb-2 block font-semibold">Profile image URL</span>
            <input className="w-full bg-transparent outline-none" value={profileForm.photoURL} onChange={(event) => setProfileForm({ ...profileForm, photoURL: event.target.value })} placeholder="Profile image URL" />
          </label>
          <div className="md:col-span-2">
            {feedback ? <p className="mb-2 text-sm text-[#E60023]">{feedback}</p> : null}
            <button className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5" type="submit" disabled={loading}>
              <ImagePlus size={16} /> Update profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
