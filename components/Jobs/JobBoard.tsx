
import React, { useState } from 'react';
import { Job, JobStatus } from '../../types';
import { Search, MapPin, Calendar, ArrowRight, X, ArrowUpDown, Filter } from 'lucide-react';

interface JobBoardProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onAddJob: (job: Job) => void;
}

type SortOption = 'date-newest' | 'date-oldest';

const JobBoard: React.FC<JobBoardProps> = ({ jobs, onSelectJob, onAddJob }) => {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-newest');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Job Form State
  const [newJob, setNewJob] = useState<Partial<Job>>({
    clientName: '',
    address: '',
    type: 'Renovation',
    value: 0,
    description: '',
    clientPhone: '',
    clientEmail: ''
  });

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'All' || job.status === filter;
    const matchesSearch = job.address.toLowerCase().includes(search.toLowerCase()) || job.clientName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    switch (sortOption) {
      case 'date-newest':
        // Sort by start date if available, else creation (id as proxy)
        const dateA = a.startDate ? new Date(a.startDate).getTime() : parseInt(a.id) || 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : parseInt(b.id) || 0;
        return dateB - dateA;
      case 'date-oldest':
        const dateAO = a.startDate ? new Date(a.startDate).getTime() : parseInt(a.id) || 0;
        const dateBO = b.startDate ? new Date(b.startDate).getTime() : parseInt(b.id) || 0;
        return dateAO - dateBO;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: JobStatus) => {
    switch(status) {
      case JobStatus.IN_PROGRESS: return 'bg-blue-100 text-wmhi-blue border-blue-200';
      case JobStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case JobStatus.NEW_JOB: return 'bg-slate-100 text-slate-600 border-slate-200';
      case JobStatus.CANCELLED: return 'bg-red-50 text-red-600 border-red-100 line-through opacity-70';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.clientName || !newJob.address) return;

    const job: Job = {
      id: Date.now().toString(),
      clientName: newJob.clientName || '',
      address: newJob.address || '',
      type: newJob.type as any,
      value: Number(newJob.value) || 0,
      description: newJob.description || '',
      clientPhone: newJob.clientPhone,
      clientEmail: newJob.clientEmail,
      status: JobStatus.NEW_JOB,
      currentStage: 'Start Date Agreed',
      assignedTeam: [],
      galleryImages: [],
      messages: [],
      nextAction: 'Initial Setup',
      siteNotes: []
    };

    onAddJob(job);
    setIsModalOpen(false);
    setNewJob({ clientName: '', address: '', type: 'Renovation', value: 0, description: '', clientPhone: '', clientEmail: '' });
  };

  const filterTabs = ['All', JobStatus.NEW_JOB, JobStatus.SCHEDULED, JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CANCELLED];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      
      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-wmhi-blue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Create New Job</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                  <input required type="text" className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue" value={newJob.clientName} onChange={e => setNewJob({...newJob, clientName: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Type</label>
                   <select className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue" value={newJob.type} onChange={e => setNewJob({...newJob, type: e.target.value as any})}>
                     <option>Garage Conversion</option>
                     <option>Extension</option>
                     <option>Renovation</option>
                     <option>Roofing</option>
                     <option>Garden Room</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                <input required type="text" className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue" value={newJob.address} onChange={e => setNewJob({...newJob, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                  <input type="tel" className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue" value={newJob.clientPhone} onChange={e => setNewJob({...newJob, clientPhone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Value (£)</label>
                  <input type="number" className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue" value={newJob.value} onChange={e => setNewJob({...newJob, value: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue h-24 resize-none" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-wmhi-red hover:bg-wmhi-redHover text-white rounded font-bold shadow-sm">Create Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-wmhi-blue">Projects</h2>
          <p className="text-slate-500">Manage jobs, assignments, and progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-wmhi-red hover:bg-wmhi-redHover text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
        >
          + New Job
        </button>
      </div>

      {/* Control Bar: Filters & Sorting */}
      <div className="flex flex-col gap-4 mb-6">
          
          {/* Top Row: Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by address or client..." 
                    className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wmhi-blue shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase pl-2 flex items-center gap-1">
                    <ArrowUpDown size={14}/> Sort By:
                  </span>
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="date-newest">Date: Newest First</option>
                    <option value="date-oldest">Date: Oldest First</option>
                  </select>
              </div>
          </div>

          {/* Bottom Row: Status Tabs */}
          <div className="overflow-x-auto pb-2 md:pb-0">
             <div className="flex gap-2">
                {filterTabs.map((f) => (
                    <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                        filter === f 
                        ? 'bg-wmhi-blue text-white border-wmhi-blue shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    >
                    {f}
                    </button>
                ))}
             </div>
          </div>
      </div>

      {/* Results Count */}
      <div className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wide">
        Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'Project' : 'Projects'}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <div 
            key={job.id} 
            onClick={() => onSelectJob(job)}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden"
          >
            {/* Value Badge */}
            <div className="absolute top-0 right-0 p-5">
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">£{job.value.toLocaleString()}</span>
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-wmhi-blue transition-colors pr-12">{job.address}</h3>
              <p className="text-slate-500 text-sm mb-4">{job.clientName} • {job.type}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-wmhi-red" />
                  <span className="truncate">{job.address}</span>
                </div>
                {job.startDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} className="text-wmhi-red" />
                    <span>Starts: {job.startDate}</span>
                  </div>
                )}
                 {/* Show current granular stage on dashboard card too */}
                 {job.currentStage && job.status !== JobStatus.CANCELLED && (
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                         <span className="inline-block w-4 h-4 rounded-full bg-green-100 border border-green-300"></span>
                         <span className="font-medium text-slate-700">{job.currentStage}</span>
                     </div>
                 )}
                 {job.architect && (
                     <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                         <span className="uppercase font-bold tracking-wider text-slate-400 text-[10px]">Architect</span>
                         <span>{job.architect}</span>
                     </div>
                 )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
              <div className="flex -space-x-2">
                {job.assignedTeam.length > 0 ? (
                  job.assignedTeam.map((userId, i) => (
                     <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">
                       {/* In a real app we'd map ID to User Avatar */}
                       {userId.charAt(1)}
                     </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                )}
              </div>
              <button className="text-wmhi-red hover:text-wmhi-redHover flex items-center gap-1 text-sm font-bold transition-colors">
                View Job <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Filter size={48} className="mx-auto mb-4 opacity-20" />
                <p>No projects found matching your criteria.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default JobBoard;
