import { useEffect, useMemo, useState } from 'react';
import { FaChartLine, FaDownload, FaFilePdf, FaPrint, FaSearch, FaTable } from 'react-icons/fa';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { fetchAllData } from '../lib/firestoreService';
import { getEmployeeName } from '../lib/data';

const Reports = () => {
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], holidays: [], settings: {} });
  const [range, setRange] = useState('monthly');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setData(await fetchAllData());
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  const reportRows = useMemo(() => {
    const now = new Date();
    const query = search.toLowerCase();

    return data.attendance.filter((entry) => {
      const employee = data.employees.find((item) => item.id === entry.employeeId);
      const entryDate = new Date(`${entry.date}T00:00:00`);
      let withinRange = true;

      if (range === 'daily') {
        withinRange = entryDate.toDateString() === now.toDateString();
      } else if (range === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        withinRange = entryDate >= weekAgo;
      } else if (range === 'yearly') {
        withinRange = entryDate.getFullYear() === now.getFullYear();
      }

      const matchesEmployee = employeeFilter === 'All' || entry.employeeId === employeeFilter;
      const matchesDepartment = departmentFilter === 'All' || employee?.department === departmentFilter;
      const matchesSearch = !query || getEmployeeName(entry.employeeId, data.employees).toLowerCase().includes(query) || entry.status.toLowerCase().includes(query);
      return withinRange && matchesEmployee && matchesDepartment && matchesSearch;
    });
  }, [data.attendance, data.employees, departmentFilter, employeeFilter, range, search]);

  const summary = useMemo(() => {
    const presentCount = reportRows.filter((entry) => entry.status === 'Present').length;
    const halfDayCount = reportRows.filter((entry) => entry.status === 'Half Day').length;
    const absentCount = reportRows.filter((entry) => entry.status === 'Absent').length;
    const leaveCount = reportRows.filter((entry) => entry.status === 'Leave').length;

    return [
      { label: 'Present', value: presentCount, color: 'bg-emerald-500/20 text-emerald-200' },
      { label: 'Half Day', value: halfDayCount, color: 'bg-amber-500/20 text-amber-200' },
      { label: 'Absent', value: absentCount, color: 'bg-rose-500/20 text-rose-200' },
      { label: 'Leave', value: leaveCount, color: 'bg-violet-500/20 text-violet-200' },
    ];
  }, [reportRows]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportRows.map((entry) => ({ ...entry, employeeName: getEmployeeName(entry.employeeId, data.employees) })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, 'reports.xlsx');
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text(`Attendance ${range} report`, 14, 14);
    autoTable(doc, { head: [['Employee', 'Date', 'Status']], body: reportRows.map((entry) => [getEmployeeName(entry.employeeId, data.employees), entry.date, entry.status]) });
    doc.save('reports.pdf');
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
            <div className={`inline-flex rounded-full px-3 py-1 text-sm ${item.color}`}>{item.label}</div>
            <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Attendance trends</h3>
            <FaChartLine className="text-cyan-300" />
          </div>
          <Line data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], datasets: [{ label: 'Attendance', data: [20, 18, 21, 19, 22], borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.2)', fill: true, tension: 0.3 }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Weekly performance</h3>
            <FaTable className="text-violet-300" />
          </div>
          <Bar data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], datasets: [{ label: 'Check-ins', data: [18, 17, 19, 20, 21], backgroundColor: '#a78bfa' }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Export-ready reports</h3>
            <p className="text-sm text-slate-400">Daily, weekly, monthly, yearly, employee-wise, and department-wise views.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
              <FaSearch />
              <input className="bg-transparent outline-none" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
              <option value="All">All employees</option>
              {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
              <option value="All">All departments</option>
              {[...new Set(data.employees.map((employee) => employee.department).filter(Boolean))].map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
            <button className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100" onClick={handleExportExcel}><FaDownload /> Excel</button>
            <button className="flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={handleExportPdf}><FaFilePdf /> PDF</button>
            <button className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={handlePrint}><FaPrint /> Print</button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-slate-300">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Department</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((entry) => {
                const employee = data.employees.find((item) => item.id === entry.employeeId);
                return (
                  <tr key={entry.id} className="border-t border-white/10">
                    <td className="px-3 py-2 text-white">{getEmployeeName(entry.employeeId, data.employees)}</td>
                    <td className="px-3 py-2">{entry.date}</td>
                    <td className="px-3 py-2">{entry.status}</td>
                    <td className="px-3 py-2">{employee?.department || 'General'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
