import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, Plus, Search, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getAttendanceMetrics, getEmployeeName } from '../lib/data';
import { deleteAttendanceEntry, fetchAllData, saveAttendanceEntry } from '../lib/firestoreService';

const emptyAttendance = { employeeId: '', date: '', status: 'Present', checkIn: '', checkOut: '' };
const statusOptions = ['Present', 'Half Day', 'Absent', 'Leave', 'Holiday', 'Weekly Off', 'Work From Home', 'Late'];

const Attendance = () => {
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], holidays: [], settings: {} });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyAttendance);
  const [filter, setFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchAllData();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => getAttendanceMetrics(data.attendance, data.settings, selectedMonth), [data.attendance, data.settings, selectedMonth]);

  const filteredAttendance = useMemo(() => {
    const query = search.toLowerCase();
    return data.attendance.filter((entry) => {
      const employeeName = getEmployeeName(entry.employeeId, data.employees).toLowerCase();
      const matchesQuery = employeeName.includes(query) || entry.status.toLowerCase().includes(query) || entry.date.includes(query);
      const matchesFilter = filter === 'All' || entry.status === filter;
      const matchesMonth = entry.date?.startsWith(selectedMonth);
      return matchesQuery && matchesFilter && matchesMonth;
    });
  }, [data.attendance, data.employees, filter, search, selectedMonth]);

  const calendarDays = useMemo(() => {
    const monthStart = new Date(`${selectedMonth}-01T00:00:00`);
    const firstDay = monthStart.getDay();
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const days = [];

    for (let index = 0; index < firstDay; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = data.attendance.find((item) => item.date === dateKey);
      days.push({ day, dateKey, status: entry?.status || 'Pending' });
    }

    return days;
  }, [data.attendance, selectedMonth]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await saveAttendanceEntry({ ...form, id: form.id || `att-${Date.now()}` });
      const refreshed = await fetchAllData();
      setData(refreshed);
      setForm(emptyAttendance);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteAttendanceEntry(id);
      const refreshed = await fetchAllData();
      setData(refreshed);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredAttendance.map((entry) => ({ ...entry, employeeName: getEmployeeName(entry.employeeId, data.employees) })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, 'attendance.xlsx');
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text('Attendance Report', 14, 14);
    autoTable(doc, { head: [['Employee', 'Date', 'Status']], body: filteredAttendance.map((entry) => [getEmployeeName(entry.employeeId, data.employees), entry.date, entry.status]) });
    doc.save('attendance.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Working Days', value: summary.workingDays, gradient: 'from-[#2563EB] to-[#7C3AED]' },
          { label: 'Present Days', value: summary.presentDays, gradient: 'from-[#22C55E] to-[#16A34A]' },
          { label: 'Half Days', value: summary.halfDays, gradient: 'from-[#FF7A00] to-[#FFD400]' },
          { label: 'Attendance %', value: `${summary.attendancePercentage.toFixed(1)}%`, gradient: 'from-[#E60023] to-[#FF7A00]' },
        ].map((card) => (
          <div key={card.label} className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
            <div className={`inline-flex rounded-2xl bg-gradient-to-br ${card.gradient} px-3 py-2 text-sm font-semibold text-white`}>
              {card.label}
            </div>
            <p className="mt-4 text-3xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Log attendance</h3>
            <span className="rounded-full bg-[#FFF3D6] px-3 py-1 text-sm font-semibold text-[#E60023]">Daily check-ins</span>
          </div>
          <div className="space-y-3">
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Employee</span>
              <select className="w-full bg-transparent outline-none" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required>
                <option value="">Select employee</option>
                {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Date</span>
              <input className="w-full bg-transparent outline-none" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Status</span>
              <select className="w-full bg-transparent outline-none" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Check-in time</span>
              <input className="w-full bg-transparent outline-none" placeholder="Check-in time" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} />
            </label>
            <label className="block rounded-[18px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 text-sm text-slate-600">
              <span className="mb-2 block font-semibold">Check-out time</span>
              <input className="w-full bg-transparent outline-none" placeholder="Check-out time" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} />
            </label>
          </div>
          <button className="mt-4 flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#E60023,_#FF7A00_60%,_#FFD400)] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5" type="submit" disabled={loading}>
            <Plus size={16} /> Save attendance
          </button>
        </form>

        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Attendance records</h3>
              <p className="text-sm text-slate-600">Calendar view, monthly stats, and export-ready reports</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-600">
                <Search size={16} className="text-[#FF7A00]" />
                <input className="bg-transparent outline-none" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <input className="rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-700" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              <select className="rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-700" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="All">All</option>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="flex items-center gap-2 rounded-2xl border border-[#2563EB]/20 bg-[#EAF2FF] px-3 py-2 text-sm font-semibold text-[#2563EB]" onClick={handleExportExcel}><Download size={16} /> Excel</button>
              <button className="flex items-center gap-2 rounded-2xl border border-[#7C3AED]/20 bg-[#F3ECFF] px-3 py-2 text-sm font-semibold text-[#7C3AED]" onClick={handleExportPdf}><Download size={16} /> PDF</button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
            {calendarDays.map((day, index) => (
              <div key={day ? `${day.dateKey}-${index}` : `empty-${index}`} className={`flex h-14 flex-col items-center justify-center rounded-2xl border text-xs ${day ? 'border-[#FFD400]/20 bg-[#FFF9E6] text-slate-700' : 'border-transparent'}`}>
                {day ? <><span>{day.day}</span><span className="mt-1 text-[10px] text-[#E60023]">{day.status}</span></> : null}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAttendance.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#EAF2FF] p-3 text-[#2563EB]"><CalendarDays size={18} /></div>
                  <div>
                    <p className="font-semibold text-slate-900">{getEmployeeName(entry.employeeId, data.employees)}</p>
                    <p className="text-sm text-slate-600">{entry.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">{entry.status}</span>
                  <span className="text-sm text-slate-600">{entry.checkIn || '—'} → {entry.checkOut || '—'}</span>
                  <button className="rounded-xl border border-[#E60023]/20 bg-white px-3 py-2 text-sm font-semibold text-[#E60023]" onClick={() => handleDelete(entry.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
