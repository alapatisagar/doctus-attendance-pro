import {
  addCollectionDoc,
  createDefaultSettings,
  deleteCollectionDoc,
  getCollectionDocs,
  updateCollectionDoc,
} from './firebase';
import { getEmployeeAvatar } from './data';

export const fetchAllData = async () => {
  const [employees, attendance, leaves, holidays, settings] = await Promise.all([
    getCollectionDocs('employees'),
    getCollectionDocs('attendance'),
    getCollectionDocs('leaves'),
    getCollectionDocs('holidays'),
    getCollectionDocs('settings'),
  ]);

  return {
    employees,
    attendance,
    leaves,
    holidays,
    settings: settings[0] || {},
  };
};

export const saveEmployee = async (employee) => {
  const payload = {
    ...employee,
    photo: getEmployeeAvatar(employee),
  };

  if (employee.id) {
    await updateCollectionDoc('employees', employee.id, payload);
    return payload;
  }

  const created = await addCollectionDoc('employees', payload);
  return created;
};

export const deleteEmployee = async (id) => {
  await deleteCollectionDoc('employees', id);
};

export const saveAttendanceEntry = async (entry) => {
  if (entry.id) {
    await updateCollectionDoc('attendance', entry.id, entry);
    return entry;
  }

  const created = await addCollectionDoc('attendance', entry);
  return created;
};

export const deleteAttendanceEntry = async (id) => {
  await deleteCollectionDoc('attendance', id);
};

export const saveLeaveRequest = async (leave) => {
  if (leave.id) {
    await updateCollectionDoc('leaves', leave.id, leave);
    return leave;
  }

  const created = await addCollectionDoc('leaves', leave);
  return created;
};

export const saveHoliday = async (holiday) => {
  if (holiday.id) {
    await updateCollectionDoc('holidays', holiday.id, holiday);
    return holiday;
  }

  const created = await addCollectionDoc('holidays', holiday);
  return created;
};

export const saveSettings = async (settings) => {
  await createDefaultSettings();
  const settingsDoc = await updateCollectionDoc('settings', 'company', settings);
  return settingsDoc;
};
