
import React, { useState } from 'react';
import { Job, JobStatus, User } from '../types';
import { ClipboardList, AlertCircle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  currentUser?: User;
}

const Dashboard: React.FC<DashboardProps> = ({ jobs, onSelectJob, currentUser }) => {
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  // Calculate Start/End of current month for default display
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Filter State
  const [filterStart, setFilterStart] = useState(startOfMonth);
  const [filterEnd, setFilterEnd] = useState(endOfMonth);

  // 1. Active Jobs
  const activeJobs = jobs.filter(j => j.status === JobStatus.IN_PROGRESS || j.status === JobStatus.SCHEDULED).length;
  
  // 2. New Jobs
  const newJobs = jobs.filter(j => j.status === JobStatus.NEW_JOB).length;
  
  // 3. Completed This Month (For Dashboard Card)
  const completedThisMonth = jobs.filter(j => {
    if (j.status !== JobStatus.COMPLETED) return false;
    // If no finish date is set, we can't count it for a specific date period
    if (!j.finishDate) return false; 
    
    const d = new Date(j.finishDate);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  // 4. Filtered Completed Jobs (For Modal)
  const filteredCompletedJobs = jobs.filter(j => {
    if (j.status !== JobStatus.COMPLETED) return false;
    if (!j.finishDate) return false;
    return j.finishDate >= filterStart && j.finishDate <= filterEnd;
  });

  // Data for chart
  const statusData = [
    { name: 'New', value: newJobs, color: '#94a3b8' }, // Slate
    { name: 'Active', value: activeJobs, color: '#1e3a8a' }, // WMHI Blue
    { name: 'Done (Mth)', value: completedThisMonth, color: '#dc2626' }, // WMHI Red
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Completed Jobs Filter Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-wmhi-red px-6 py-4 flex justify-between items-center text-white">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 size={20}/> Completed Projects Report
                 </h3>
                 <button onClick={() => setShowCompletedModal(false)} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
              </div>
              <div className="p-6">
                 <p className="text-slate-500 mb-4 text-sm">Select a date range to view completed projects and their values.</p>
                 
                 <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex-1">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From Date</label>
                       <input 
                         type="date" 
                         value={filterStart} 
                         onChange={e => setFilterStart(e.target.value)} 
                         className="w-full p-2 border border-slate-300 rounded focus:ring-wmhi-red focus:outline-none" 
                       />
                    </div>
                    <div className="flex-1">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To Date</label>
                       <input 
                         type="date" 
                         value={filterEnd} 
                         onChange={e => setFilterEnd(e.target.value)} 
                         className="w-full p-2 border border-slate-300 rounded focus:ring-wmhi-red focus:outline-none" 
                       />
                    </div>
                 </div>

                 <div className="mb-4 flex justify-between items-end border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-700">Projects Found: {filteredCompletedJobs.length}</h4>
                    <span className="text-sm font-bold text-wmhi-blue">Total Value: £{filteredCompletedJobs.reduce((acc, j) => acc + j.value, 0).toLocaleString()}</span>
                 </div>

                 <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                    {filteredCompletedJobs.length > 0 ? (
                        filteredCompletedJobs.map(job => (
                            <div key={job.id} onClick={() => { setShowCompletedModal(false); onSelectJob(job); }} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
                                <div>
                                    <p className="font-bold text-slate-800 group-hover:text-wmhi-blue text-sm">{job.address}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span>Completed: {job.finishDate}</span>
                                        <span>•</span>
                                        <span>{job.clientName}</span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">£{job.value.toLocaleString()}</span>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-wmhi-red"/>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
                            No completed jobs found in this date range.
                        </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-wmhi-blue">{greeting}{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}</h2>
        <p className="text-slate-500">Overview of site operations and production pipeline.</p>
      </div>

      {/* Stats Grid - Modified to 3 Columns, Pipeline Value removed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-wmhi-blue rounded-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Sites</p>
            <p className="text-2xl font-bold text-slate-900">{activeJobs}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">New Jobs</p>
            <p className="text-2xl font-bold text-slate-900">{newJobs}</p>
          </div>
        </div>

        {/* Clickable Completed Card */}
        <div 
            onClick={() => setShowCompletedModal(true)}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-200 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-red-50 text-wmhi-red rounded-lg group-hover:bg-red-100 transition-colors">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 font-medium group-hover:text-slate-700">Completed (This Month)</p>
            <p className="text-2xl font-bold text-slate-900">{completedThisMonth}</p>
          </div>
          <ArrowRight size={20} className="text-slate-300 group-hover:text-wmhi-red opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <h3 className="text-lg font-semibold text-wmhi-blue mb-6">Job Status Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fill: '#64748b'}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" barSize={32} radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-wmhi-blue mb-4">Urgent Actions</h3>
          <div className="space-y-4">
            {jobs.filter(j => j.status === JobStatus.IN_PROGRESS).map(job => (
              <div 
                key={job.id} 
                onClick={() => onSelectJob(job)}
                className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-red-200 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-wmhi-blue bg-blue-100 px-2 py-1 rounded">{job.type}</span>
                  <span className="text-xs text-slate-400">Today</span>
                </div>
                <h4 className="font-medium text-slate-900">{job.address}</h4>
                <p className="text-sm text-slate-500 mt-1 truncate">{job.nextAction || 'Check site progress'}</p>
              </div>
            ))}
            {jobs.filter(j => j.status === JobStatus.IN_PROGRESS).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-sm">No urgent actions pending.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
