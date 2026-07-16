export const getEmployeeName = (employeeId, employees) => {
  const employee = employees.find((item) => item.id === employeeId);
  return employee ? employee.name : 'Unknown';
};

export const formatDate = (value) => {
  if (!value) {
    return '--';
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const generateEmployeeCode = (employees) => {
  const nextNumber = employees.length + 1;
  return `EMP${String(nextNumber).padStart(3, '0')}`;
};

export const getAttendanceMetrics = (attendance, settings, monthKey) => {
  const monthEntries = attendance.filter((entry) => entry.date?.startsWith(monthKey));
  const yearKey = monthKey.slice(0, 4);
  const yearEntries = attendance.filter((entry) => entry.date?.startsWith(yearKey));
  const workingDays = settings?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const monthStart = new Date(`${monthKey}-01T00:00:00`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const monthDays = Array.from({ length: monthEnd.getDate() }, (_, index) => index + 1);
  const holidays = new Set((attendance || []).filter((entry) => entry.status === 'Holiday' && entry.date?.startsWith(monthKey)).map((entry) => entry.date));

  const workingDayCount = monthDays.filter((day) => {
    const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dayName = currentDate.toLocaleDateString('en', { weekday: 'long' });
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    return workingDays.includes(dayName) && !holidays.has(dateKey);
  }).length;

  const presentDays = monthEntries.filter((entry) => entry.status === 'Present').length;
  const halfDays = monthEntries.filter((entry) => entry.status === 'Half Day').length;
  const attendancePercentage = workingDayCount ? ((presentDays + halfDays * 0.5) / workingDayCount) * 100 : 0;

  const yearWorkingDays = Array.from({ length: 12 }, (_, monthIndex) => {
    const date = new Date(`${yearKey}-${String(monthIndex + 1).padStart(2, '0')}-01T00:00:00`);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), dayIndex + 1);
      const dayName = currentDate.toLocaleDateString('en', { weekday: 'long' });
      return workingDays.includes(dayName) ? 1 : 0;
    }).reduce((sum, value) => sum + value, 0);
  }).reduce((sum, value) => sum + value, 0);

  const yearAttendancePercentage = yearWorkingDays ? ((yearEntries.filter((entry) => entry.status === 'Present').length + yearEntries.filter((entry) => entry.status === 'Half Day').length * 0.5) / yearWorkingDays) * 100 : 0;

  return {
    workingDays: workingDayCount,
    presentDays,
    halfDays,
    attendancePercentage,
    monthlyPercentage: attendancePercentage,
    yearlyPercentage: yearAttendancePercentage,
  };
};

export const getLeaveBalance = (leaves) => {
  const defaults = { CL: 12, SL: 10, EL: 15, LOP: 0 };
  const balances = { ...defaults };

  leaves.forEach((leave) => {
    if (leave.status === 'Approved') {
      balances[leave.type] = Math.max(0, (balances[leave.type] || 0) - 1);
    }
  });

  return balances;
};

export const getUpcomingEvents = (employees) => {
  const today = new Date();
  const birthdays = employees.filter((employee) => {
    if (!employee.dateOfBirth) {
      return false;
    }
    const birthDate = new Date(`${employee.dateOfBirth}T00:00:00`);
    return birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate();
  });

  const anniversaries = employees.filter((employee) => {
    if (!employee.joinDate) {
      return false;
    }
    const joinDate = new Date(`${employee.joinDate}T00:00:00`);
    return joinDate.getMonth() === today.getMonth() && joinDate.getDate() === today.getDate();
  });

  return { birthdays, anniversaries };
};

export const getEmployeeAvatar = (employee) => {
  if (employee?.photo) {
    return employee.photo;
  }

  const name = employee?.name || 'HR';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const palette = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#fb7185'];
  const color = palette[Math.abs(initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % palette.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="${color}" />
      <circle cx="60" cy="50" r="24" fill="rgba(255,255,255,0.92)" />
      <path d="M28 104c6-18 22-28 32-28s26 10 32 28" fill="rgba(255,255,255,0.92)" />
      <text x="60" y="112" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#0f172a" font-weight="700">${initials || 'HR'}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
