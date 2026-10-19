import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckSquare, AlertCircle, Building2, Filter, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { TaskItem, TaskPriority, TaskStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const TaskManagementPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.tasks.list({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTasks(data);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleToggleStatus = async (task: TaskItem) => {
    const nextStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      await api.tasks.update(task.id, { status: nextStatus });
      toast.success(`Task marked as ${nextStatus}!`);
      fetchTasks();
    } catch (e) {
      console.error('Failed to update task:', e);
      toast.error('Failed to update task status.');
    }
  };

  const isOverdue = (dueDateStr?: string, status?: string) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    return new Date(dueDateStr) < new Date();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reviewer Task Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage compliance tasks, resolve flagged discrepancies, and follow up on missing documents.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['', 'PENDING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === '' ? 'All Tasks' : st === 'PENDING' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Priority:</span>
          {['', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
            <button
              key={pr}
              type="button"
              onClick={() => setPriorityFilter(pr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                priorityFilter === pr
                  ? 'bg-brand-50 text-brand-700 border border-brand-300'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {pr === '' ? 'All' : pr}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">Done</th>
                <th className="py-3.5 px-4">Task Title & Details</th>
                <th className="py-3.5 px-4">Related Vendor</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No tasks match the selected filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const overdue = isOverdue(task.due_date, task.status);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={task.status === 'COMPLETED'}
                          onChange={() => handleToggleStatus(task)}
                          className="rounded text-brand-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-brand-700">
                        <Link to={`/vendors/${task.vendor_id}`} className="hover:underline flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{task.vendor_company_name || `Vendor #${task.vendor_id}`}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        {task.due_date ? (
                          <div className="flex items-center gap-1.5">
                            <span className={overdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                            {overdue && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">No deadline</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {new Date(task.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
