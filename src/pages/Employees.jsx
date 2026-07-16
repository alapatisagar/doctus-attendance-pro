import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaSearch, FaTrash, FaEdit } from 'react-icons/fa';
import { deleteEmployee, fetchAllData, saveEmployee } from '../lib/firestoreService';
import { generateEmployeeCode, getEmployeeAvatar } from '../lib/data';

const emptyEmployee = {
  employeeCode: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  manager: '',
  dateOfBirth: '',
  joinDate: '',
  address: '',
  emergencyContact: '',
  status: 'Active',
  photo: '',
};

const departmentOptions = ['Operations', 'HR', 'Engineering', 'Finance', 'Sales', 'Support', 'Clinical'];

const Employees = () => {
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], holidays: [], settings: {} });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyEmployee);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
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

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, departmentFilter]);

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase();
    return data.employees.filter((employee) => {
      const matchesQuery = [employee.name, employee.department, employee.designation, employee.employeeCode].join(' ').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || employee.status === statusFilter;
      const matchesDepartment = departmentFilter === 'All' || employee.department === departmentFilter;
      return matchesQuery && matchesStatus && matchesDepartment;
    });
  }, [data.employees, departmentFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / 6));
  const paginatedEmployees = filteredEmployees.slice((page - 1) * 6, page * 6);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        employeeCode: form.employeeCode || generateEmployeeCode(data.employees),
        id: editingId || `emp-${Date.now()}`,
        designation: form.designation || 'Staff',
      };
      await saveEmployee(payload, photoFile);
      const refreshed = await fetchAllData();
      setData(refreshed);
      setForm(emptyEmployee);
      setEditingId(null);
      setPhotoFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setForm({ ...emptyEmployee, ...employee });
  };

  const handleDelete = async (employeeId) => {
    setLoading(true);
    try {
      await deleteEmployee(employeeId);
      const refreshed = await fetchAllData();
      setData(refreshed);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit employee' : 'Add employee'}</h3>
          <span className="text-sm text-slate-400">HR records</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Employee code" value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" list="departments" placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          <datalist id="departments">
            {departmentOptions.map((department) => <option key={department} value={department} />)}
          </datalist>
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Designation" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Manager" value={form.manager} onChange={(event) => setForm({ ...form, manager: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="date" value={form.joinDate} onChange={(event) => setForm({ ...form, joinDate: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" placeholder="Emergency contact" value={form.emergencyContact} onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })} />
          <select className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400 sm:col-span-2">
            Profile photos are temporarily using generated initials avatars while Firebase Storage is disabled.
          </div>
        </div>
        <button className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
          <FaPlus /> {editingId ? 'Update employee' : 'Create employee'}
        </button>
      </form>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white">Employee directory</h3>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
              <FaSearch />
              <input className="bg-transparent outline-none" placeholder="Search employees" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
              <option value="All">All departments</option>
              {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {paginatedEmployees.map((employee) => (
            <div key={employee.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img src={getEmployeeAvatar(employee)} alt={employee.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-white">{employee.employeeCode || 'EMP000'} • {employee.name}</p>
                  <p className="text-sm text-slate-400">{employee.designation || 'Staff'} • {employee.department || 'General'} • {employee.manager || 'No manager assigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10" onClick={() => handleEdit(employee)}><FaEdit /></button>
                <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10" onClick={() => handleDelete(employee.id)}><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="rounded-xl border border-white/10 px-3 py-2" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Prev</button>
            <button className="rounded-xl border border-white/10 px-3 py-2" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
