import { useEffect, useMemo, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { FaBirthdayCake, FaCalendarCheck, FaClock, FaFileAlt, FaUsers } from 'react-icons/fa';
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
        backgroundColor: ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#fb7185'],
      }],
    };
  }, [data.employees]);

  const attendanceTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const values = months.map((_, index) => data.attendance.filter((entry) => new Date(`${entry.date}T00:00:00`).getMonth() === index).length);
    return { labels: months, datasets: [{ label: 'Attendance logs', data: values, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.2)', fill: true, tension: 0.3 }] };
  }, [data.attendance]);

  const leaveTrend = useMemo(() => {
    const counts = { CL: 0, SL: 0, EL: 0, LOP: 0 };
    data.leaves.forEach((leave) => { counts[leave.type] = (counts[leave.type] || 0) + 1; });
    return { labels: Object.keys(counts), datasets: [{ label: 'Leave requests', data: Object.values(counts), backgroundColor: '#a78bfa' }] };
  }, [data.leaves]);

  const growthTrend = useMemo(() => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const values = labels.map((_, index) => data.employees.filter((employee) => employee.joinDate && new Date(`${employee.joinDate}T00:00:00`).getMonth() <= index).length);
    return { labels, datasets: [{ label: 'Employee growth', data: values, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.2)', fill: true, tension: 0.3 }] };
  }, [data.employees]);

  const upcomingEvents = useMemo(() => getUpcomingEvents(data.employees), [data.employees]);

  const recentActivity = useMemo(() => {
    const activities = [
      ...data.employees.slice(0, 3).map((employee) => ({ title: `New employee created: ${employee.name}`, detail: employee.department || 'Department pending' })),
      ...data.leaves.slice(0, 3).map((leave) => ({ title: `Leave request: ${leave.type}`, detail: `${leave.employeeName} • ${leave.status}` })),
      ...data.attendance.slice(0, 3).map((entry) => ({ title: `Attendance logged`, detail: `${getEmployeeName(entry.employeeId, data.employees)} • ${entry.status}` })),
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
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Active Employees', value: data.employees.length, icon: FaUsers },
          { label: 'Present Today', value: data.attendance.filter((entry) => entry.status === 'Present').length, icon: FaCalendarCheck },
          { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: FaClock },
          { label: 'Pending Leaves', value: data.leaves.filter((entry) => entry.status === 'Pending').length, icon: FaFileAlt },
        ].map((card) => (
          <div key={card.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
              </div>
              <card.icon className="text-2xl text-cyan-300" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Attendance Trend</h3>
            <span className="text-sm text-slate-400">Live data from Firestore</span>
          </div>
          <Line data={attendanceTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Department Mix</h3>
            <span className="text-sm text-slate-400">Current roster</span>
          </div>
          <Doughnut data={departmentData} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Leave & growth insights</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-400">Leave graph</p>
              <Line data={leaveTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-400">Employee growth</p>
              <Line data={growthTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Today at a glance</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={`${activity.title}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <p className="font-medium text-white">{activity.title}</p>
                <p className="text-sm text-slate-400">{activity.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Today&apos;s birthday</h3>
          <div className="space-y-3">
            {upcomingEvents.birthdays.length ? upcomingEvents.birthdays.map((employee) => (
              <div key={employee.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <FaBirthdayCake className="text-cyan-300" />
                <div>
                  <p className="font-medium text-white">{employee.name}</p>
                  <p className="text-sm text-slate-400">{employee.department || 'Department pending'}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No birthdays today.</p>}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Upcoming anniversary</h3>
          <div className="space-y-3">
            {upcomingEvents.anniversaries.length ? upcomingEvents.anniversaries.map((employee) => (
              <div key={employee.id} className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <p className="font-medium text-white">{employee.name}</p>
                <p className="text-sm text-slate-400">Joined on {employee.joinDate}</p>
              </div>
            )) : <p className="text-sm text-slate-400">No anniversaries today.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-semibold text-white">Monthly calendar</h3>
        <p className="mb-3 text-sm text-slate-400">{calendar.monthName}</p>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
          {calendar.cells.map((cell, index) => <div key={`${cell.day || 'empty'}-${index}`} className={`flex h-8 items-center justify-center rounded-xl ${cell.holiday ? 'bg-cyan-500/20 text-cyan-100' : 'bg-slate-900/40 text-slate-300'}`}>{cell.day || ''}</div>)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
