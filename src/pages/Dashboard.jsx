import { useEffect, useMemo, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { BadgeCheck, CalendarCheck2, Clock3, Gift, Sparkles, UsersRound, FileText, TrendingUp } from 'lucide-react';
import { fetchAllData } from '../lib/firestoreService';
import { getEmployeeName, getUpcomingEvents } from '../lib/data';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const Dashboard = () => {
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], holidays: [], settings: {} });

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

  const attendanceRate = useMemo(() => {
    const total = data.attendance.length;
    const present = data.attendance.filter((entry) => entry.status === 'Present').length;
    return total ? Math.round((present / total) * 100) : 0;
  }, [data.attendance]);

  const departmentData = useMemo(() => {
    const counts = data.employees.reduce((accumulator, employee) => {
      const key = employee.department || 'General';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#E60023', '#FF7A00', '#FFD400', '#2563EB', '#7C3AED'],
      }],
    };
  }, [data.employees]);

  const attendanceTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const values = months.map((_, index) => data.attendance.filter((entry) => new Date(`${entry.date}T00:00:00`).getMonth() === index).length);
    return { labels: months, datasets: [{ label: 'Attendance logs', data: values, borderColor: '#E60023', backgroundColor: 'rgba(230, 0, 35, 0.16)', fill: true, tension: 0.35 }] };
  }, [data.attendance]);

  const leaveTrend = useMemo(() => {
    const counts = { CL: 0, SL: 0, EL: 0, LOP: 0 };
    data.leaves.forEach((leave) => { counts[leave.type] = (counts[leave.type] || 0) + 1; });
    return { labels: Object.keys(counts), datasets: [{ label: 'Leave requests', data: Object.values(counts), backgroundColor: ['#FFD400', '#FF7A00', '#E60023', '#2563EB'] }] };
  }, [data.leaves]);

  const growthTrend = useMemo(() => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const values = labels.map((_, index) => data.employees.filter((employee) => employee.joinDate && new Date(`${employee.joinDate}T00:00:00`).getMonth() <= index).length);
    return { labels, datasets: [{ label: 'Employee growth', data: values, borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.16)', fill: true, tension: 0.35 }] };
  }, [data.employees]);

  const upcomingEvents = useMemo(() => getUpcomingEvents(data.employees), [data.employees]);

  const recentActivity = useMemo(() => {
    const activities = [
      ...data.employees.slice(0, 3).map((employee) => ({ title: `New employee created: ${employee.name}`, detail: employee.department || 'Department pending' })),
      ...data.leaves.slice(0, 3).map((leave) => ({ title: `Leave request: ${leave.type}`, detail: `${leave.employeeName} • ${leave.status}` })),
      ...data.attendance.slice(0, 3).map((entry) => ({ title: 'Attendance logged', detail: `${getEmployeeName(entry.employeeId, data.employees)} • ${entry.status}` })),
    ];
    return activities.slice(0, 6);
  }, [data.attendance, data.employees, data.leaves]);

  const calendar = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const holidaySet = new Set((data.holidays || []).map((holiday) => holiday.date));
    const cells = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push({ day: '', holiday: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, holiday: holidaySet.has(dateKey) });
    }

    return { monthName: today.toLocaleString('en', { month: 'long', year: 'numeric' }), cells };
  }, [data.holidays]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#FFD400]/35 bg-[linear-gradient(135deg,_#E60023_0%,_#FF7A00_50%,_#FFD400_100%)] p-6 shadow-[0_20px_55px_-22px_rgba(230,0,35,0.35)] text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em]">
              <Sparkles size={14} />
              Executive view
            </div>
            <h3 className="mt-4 text-3xl font-black sm:text-4xl">Welcome to DOCTUS BUSINESS SOLUTIONS ATTENDANCE MANAGEMENT SYSTEM</h3>
            <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">Track workforce health, simplify operations, and keep your organization moving with a premium HRMS experience.</p>
          </div>
          <div className="rounded-[24px] border border-white/30 bg-white/15 px-4 py-3 backdrop-blur">
            <p className="text-sm font-semibold">Today&apos;s readiness</p>
            <p className="text-2xl font-black">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Total Employees', value: data.employees.length, icon: UsersRound, gradient: 'from-[#2563EB] to-[#7C3AED]' },
          { label: 'Present Today', value: data.attendance.filter((entry) => entry.status === 'Present').length, icon: CalendarCheck2, gradient: 'from-[#22C55E] to-[#16A34A]' },
          { label: 'Absent Today', value: data.attendance.filter((entry) => entry.status === 'Absent').length, icon: Clock3, gradient: 'from-[#E60023] to-[#FF7A00]' },
          { label: 'On Leave', value: data.leaves.filter((entry) => entry.status === 'Pending').length, icon: FileText, gradient: 'from-[#FF7A00] to-[#FFD400]' },
          { label: 'Attendance %', value: `${attendanceRate}%`, icon: TrendingUp, gradient: 'from-[#7C3AED] to-[#2563EB]' },
          { label: 'Holidays', value: data.holidays.length, icon: BadgeCheck, gradient: 'from-[#FFD400] to-[#FF7A00]' },
        ].map((card) => (
          <div key={card.label} className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_-22px_rgba(230,0,35,0.2)]">
            <div className={`inline-flex rounded-2xl bg-gradient-to-br ${card.gradient} p-3 text-white`}>
              <card.icon size={20} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Attendance Trend</h3>
            <span className="rounded-full bg-[#FFF3D6] px-3 py-1 text-sm font-semibold text-[#E60023]">Live data</span>
          </div>
          <Line data={attendanceTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Department Distribution</h3>
            <span className="text-sm font-semibold text-slate-500">Current roster</span>
          </div>
          <Doughnut data={departmentData} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <h3 className="mb-4 text-lg font-black text-slate-900">Leave Analytics</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3">
              <p className="text-sm font-semibold text-slate-600">Leave requests</p>
              <Line data={leaveTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] p-3">
              <p className="text-sm font-semibold text-slate-600">Growth</p>
              <Line data={growthTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <h3 className="mb-4 text-lg font-black text-slate-900">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={`${activity.title}-${index}`} className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] px-4 py-3">
                <p className="font-semibold text-slate-900">{activity.title}</p>
                <p className="text-sm text-slate-600">{activity.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <h3 className="mb-4 text-lg font-black text-slate-900">Birthdays</h3>
          <div className="space-y-3">
            {upcomingEvents.birthdays.length ? upcomingEvents.birthdays.map((employee) => (
              <div key={employee.id} className="flex items-center gap-3 rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] px-4 py-3">
                <Gift className="text-[#E60023]" size={18} />
                <div>
                  <p className="font-semibold text-slate-900">{employee.name}</p>
                  <p className="text-sm text-slate-600">{employee.department || 'Department pending'}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-600">No birthdays today.</p>}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
          <h3 className="mb-4 text-lg font-black text-slate-900">Anniversaries</h3>
          <div className="space-y-3">
            {upcomingEvents.anniversaries.length ? upcomingEvents.anniversaries.map((employee) => (
              <div key={employee.id} className="rounded-[20px] border border-[#FFD400]/20 bg-[#FFF9E6] px-4 py-3">
                <p className="font-semibold text-slate-900">{employee.name}</p>
                <p className="text-sm text-slate-600">Joined on {employee.joinDate}</p>
              </div>
            )) : <p className="text-sm text-slate-600">No anniversaries today.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#FFD400]/30 bg-white/80 p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.18)]">
        <h3 className="mb-4 text-lg font-black text-slate-900">Monthly calendar</h3>
        <p className="mb-3 text-sm text-slate-600">{calendar.monthName}</p>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
          {calendar.cells.map((cell, index) => <div key={`${cell.day || 'empty'}-${index}`} className={`flex h-9 items-center justify-center rounded-2xl ${cell.holiday ? 'bg-[#FFF3D6] text-[#E60023]' : 'bg-[#FFF9E6] text-slate-700'}`}>{cell.day || ''}</div>)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
