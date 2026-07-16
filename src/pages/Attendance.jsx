import { useEffect, useMemo, useState } from 'react';
import { FaCalendarCheck, FaDownload, FaPlus, FaSearch } from 'react-icons/fa';
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
          { label: 'Working Days', value: summary.workingDays },
          { label: 'Present Days', value: summary.presentDays },
          { label: 'Half Days', value: summary.halfDays },
          { label: 'Attendance %', value: `${summary.attendancePercentage.toFixed(1)}%` },
        ].map((card) => (
          <div key={card.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Log attendance</h3>
            <span className="text-sm text-slate-400">Daily check-ins</span>
          </div>
          <div className="space-y-3">
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required>
              <option value="">Select employee</option>
              {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Check-in time" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Check-out time" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} />
          </div>
          <button className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
            <FaPlus /> Save attendance
          </button>
        </form>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Attendance records</h3>
              <p className="text-sm text-slate-400">Calendar view, monthly stats, and export-ready reports</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
                <FaSearch />
                <input className="bg-transparent outline-none" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="All">All</option>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100" onClick={handleExportExcel}><FaDownload /> Excel</button>
              <button className="flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={handleExportPdf}><FaDownload /> PDF</button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
            {calendarDays.map((day, index) => (
              <div key={day ? `${day.dateKey}-${index}` : `empty-${index}`} className={`flex h-14 flex-col items-center justify-center rounded-xl border text-xs ${day ? 'border-white/10 bg-slate-900/40 text-slate-200' : 'border-transparent'}`}>
                {day ? <><span>{day.day}</span><span className="mt-1 text-[10px] text-cyan-200">{day.status}</span></> : null}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAttendance.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-500/20 p-3 text-cyan-200"><FaCalendarCheck /></div>
                  <div>
                    <p className="font-semibold text-white">{getEmployeeName(entry.employeeId, data.employees)}</p>
                    <p className="text-sm text-slate-400">{entry.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">{entry.status}</span>
                  <span className="text-sm text-slate-400">{entry.checkIn || '—'} → {entry.checkOut || '—'}</span>
                  <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10" onClick={() => handleDelete(entry.id)}>Delete</button>
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
