import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileText, Printer, Search, Table2 } from 'lucide-react';
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
      { label: 'Present', value: presentCount, color: 'bg-[#ECFDF3] text-[#16A34A]' },
      { label: 'Half Day', value: halfDayCount, color: 'bg-[#FFF7ED] text-[#EA580C]' },
      { label: 'Absent', value: absentCount, color: 'bg-[#FEF2F2] text-[#E60023]' },
      { label: 'Leave', value: leaveCount, color: 'bg-[#F3ECFF] text-[#7C3AED]' },
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
          <div key={item.label} className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
            <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${item.color}`}>{item.label}</div>
            <p className="mt-4 text-3xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Attendance trends</h3>
            <BarChart3 className="text-[#E60023]" />
          </div>
          <Line data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], datasets: [{ label: 'Attendance', data: [20, 18, 21, 19, 22], borderColor: '#E60023', backgroundColor: 'rgba(230, 0, 35, 0.16)', fill: true, tension: 0.3 }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Weekly performance</h3>
            <Table2 className="text-[#7C3AED]" />
          </div>
          <Bar data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], datasets: [{ label: 'Check-ins', data: [18, 17, 19, 20, 21], backgroundColor: ['#FFD400', '#FF7A00', '#E60023', '#2563EB', '#7C3AED'] }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Export-ready reports</h3>
            <p className="text-sm text-slate-600">Daily, weekly, monthly, yearly, employee-wise, and department-wise views.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-600">
              <Search size={16} className="text-[#FF7A00]" />
              <input className="bg-transparent outline-none" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select className="rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-700" value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select className="rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-700" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
              <option value="All">All employees</option>
              {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <select className="rounded-2xl border border-[#FFD400]/20 bg-[#FFF9E6] px-3 py-2 text-sm text-slate-700" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
              <option value="All">All departments</option>
              {[...new Set(data.employees.map((employee) => employee.department).filter(Boolean))].map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
            <button className="flex items-center gap-2 rounded-2xl border border-[#2563EB]/20 bg-[#EAF2FF] px-3 py-2 text-sm font-semibold text-[#2563EB]" onClick={handleExportExcel}><Download size={16} /> Excel</button>
            <button className="flex items-center gap-2 rounded-2xl border border-[#7C3AED]/20 bg-[#F3ECFF] px-3 py-2 text-sm font-semibold text-[#7C3AED]" onClick={handleExportPdf}><FileText size={16} /> PDF</button>
            <button className="flex items-center gap-2 rounded-2xl border border-[#22C55E]/20 bg-[#ECFDF3] px-3 py-2 text-sm font-semibold text-[#16A34A]" onClick={handlePrint}><Printer size={16} /> Print</button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead>
              <tr className="text-left text-slate-600">
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
                  <tr key={entry.id} className="border-t border-[#FFD400]/20">
                    <td className="px-3 py-2 font-semibold text-slate-900">{getEmployeeName(entry.employeeId, data.employees)}</td>
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
