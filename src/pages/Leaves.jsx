import { useEffect, useMemo, useState } from 'react';
import { FaBell, FaPlus, FaSearch } from 'react-icons/fa';
import { fetchAllData, saveLeaveRequest } from '../lib/firestoreService';
import { getLeaveBalance } from '../lib/data';

const emptyLeave = { employeeId: '', employeeName: '', type: 'CL', from: '', to: '', reason: '', status: 'Pending' };

const Leaves = () => {
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], holidays: [], settings: {} });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyLeave);
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

  const filteredLeaves = useMemo(() => {
    const query = search.toLowerCase();
    return data.leaves.filter((leave) => [leave.employeeName, leave.type, leave.status].join(' ').toLowerCase().includes(query));
  }, [data.leaves, search]);

  const leaveBalance = useMemo(() => getLeaveBalance(data.leaves), [data.leaves]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const employee = data.employees.find((item) => item.id === form.employeeId);
      await saveLeaveRequest({ ...form, employeeName: employee?.name || form.employeeName, id: `leave-${Date.now()}` });
      const refreshed = await fetchAllData();
      setData(refreshed);
      setForm(emptyLeave);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leave, status) => {
    setLoading(true);
    try {
      await saveLeaveRequest({ ...leave, status });
      const refreshed = await fetchAllData();
      setData(refreshed);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(leaveBalance).map(([type, balance]) => (
          <div key={type} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
            <p className="text-sm text-slate-400">{type} Balance</p>
            <p className="mt-2 text-2xl font-semibold text-white">{balance}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Create leave request</h3>
            <span className="text-sm text-slate-400">Track approvals</span>
          </div>
          <div className="space-y-3">
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required>
              <option value="">Select employee</option>
              {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="CL">CL</option>
              <option value="SL">SL</option>
              <option value="EL">EL</option>
              <option value="LOP">LOP</option>
            </select>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="date" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} required />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" type="date" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} required />
            <textarea className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" rows="3" placeholder="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <button className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400" type="submit" disabled={loading}>
            <FaPlus /> Submit leave
          </button>
        </form>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Leave requests</h3>
              <p className="text-sm text-slate-400">Approve, reject, and review leave history</p>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
              <FaSearch />
              <input className="bg-transparent outline-none" placeholder="Search leaves" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
          <div className="space-y-3">
            {filteredLeaves.map((leave) => (
              <div key={leave.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-violet-500/20 p-3 text-violet-200"><FaBell /></div>
                    <div>
                      <p className="font-semibold text-white">{leave.employeeName}</p>
                      <p className="text-sm text-slate-400">{leave.type} • {leave.from} to {leave.to}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">{leave.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{leave.reason}</p>
                {leave.status === 'Pending' ? (
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200" onClick={() => handleStatusChange(leave, 'Approved')}>Approve</button>
                    <button className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" onClick={() => handleStatusChange(leave, 'Rejected')}>Reject</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
