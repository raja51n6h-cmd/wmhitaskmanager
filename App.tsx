
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobBoard from './components/Jobs/JobBoard';
import JobDetail from './components/Jobs/JobDetail';
import UnifiedInbox from './components/UnifiedInbox';
import TaskBoard from './components/Tasks/TaskBoard';
import Settings from './components/Settings';
import { View, Job, User, Task } from './types';
import { INITIAL_JOBS, USERS, INITIAL_TASKS } from './mockData';
import { Menu, X, Plus, UserPlus, LogOut, AlertCircle, MoreVertical, Trash2, KeyRound } from 'lucide-react';

// --- Login Component ---
const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulate Network Delay
    setTimeout(() => {
        const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            if (password.length > 0) {
                onLogin(user);
            } else {
                setError('Please enter your password.');
            }
        } else {
            setError('Invalid email address. Please contact Admin.');
        }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-300 border border-slate-200">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-black text-wmhi-blue tracking-tight mb-2">WEST MIDLANDS</h1>
           <p className="text-sm font-bold text-wmhi-red tracking-[0.25em] uppercase">Home Improvements</p>
           <div className="h-px w-24 bg-slate-200 mx-auto my-6"></div>
           <p className="text-slate-400 font-medium text-sm uppercase tracking-wide">Internal Portal Login</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600 animate-in slide-in-from-top-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input 
                    type="email" 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-wmhi-blue outline-none transition-all"
                    placeholder="name@wmhi.co.uk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <input 
                    type="password" 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-wmhi-blue outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
            </div>
            <button className="w-full bg-wmhi-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                Sign In
            </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">Restricted Access. Authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'Builder', email: '' });
  const [activeTeamMenuId, setActiveTeamMenuId] = useState<string | null>(null);

  // Remove User Modal State
  const [removeUserModalState, setRemoveUserModalState] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null
  });

  // Reset Password Modal State
  const [resetPasswordState, setResetPasswordState] = useState<{ isOpen: boolean; user: User | null; newPass: string }>({ 
      isOpen: false, 
      user: null, 
      newPass: '' 
  });

  // Load data from localStorage on mount
  useEffect(() => {
    // 1. Load User Auth
    const savedUser = localStorage.getItem('wmhi_currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    // 2. Load Data
    const savedJobs = localStorage.getItem('wmhi_jobs');
    const savedTasks = localStorage.getItem('wmhi_tasks');
    const savedUsers = localStorage.getItem('wmhi_users');
    
    if (savedJobs) {
      // Restore Dates from stringified JSON
      const parsedJobs = JSON.parse(savedJobs).map((j: any) => ({
        ...j,
        messages: j.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        siteNotes: j.siteNotes ? j.siteNotes.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })) : []
      }));
      setJobs(parsedJobs);
    } else {
      setJobs(INITIAL_JOBS);
    }

    if (savedTasks) {
       const parsedTasks = JSON.parse(savedTasks).map((t: any) => ({
           ...t,
           createdAt: new Date(t.createdAt)
       }));
       setTasks(parsedTasks);
    } else {
       setTasks(INITIAL_TASKS);
    }

    if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
    } else {
        setUsers(USERS);
    }

    setLoading(false);
  }, []);

  // Save data to localStorage whenever changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wmhi_jobs', JSON.stringify(jobs));
    }
  }, [jobs, loading]);

  useEffect(() => {
      if (!loading) {
          localStorage.setItem('wmhi_tasks', JSON.stringify(tasks));
      }
  }, [tasks, loading]);

  useEffect(() => {
    if (!loading) {
        localStorage.setItem('wmhi_users', JSON.stringify(users));
    }
  }, [users, loading]);

  // Auth Handlers
  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('wmhi_currentUser', JSON.stringify(user));
  };

  const handleSignOut = () => {
      setCurrentUser(null);
      localStorage.removeItem('wmhi_currentUser');
      setCurrentView(View.DASHBOARD);
      setSelectedJob(null);
  };

  // Derived State: Filter jobs based on permissions
  const visibleJobs = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') {
      return jobs;
    }
    return jobs.filter(job => job.assignedTeam.includes(currentUser.id));
  }, [jobs, currentUser]);

  // Handlers
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setCurrentView(View.JOBS); // Ensure tab is active
  };

  const handleUpdateJob = (updatedJob: Job) => {
    const updatedJobs = jobs.map(j => j.id === updatedJob.id ? updatedJob : j);
    setJobs(updatedJobs);
    setSelectedJob(updatedJob);
  };

  const handleAddJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    setCurrentView(View.JOBS);
  };

  const handleDeleteJob = (jobId: string) => {
    // Confirmation is now handled in the UI component (JobDetail)
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setSelectedJob(null);
    setCurrentView(View.JOBS);
  };

  const handleAddTask = (newTask: Task) => {
      setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newMember.name) return;

    const newUser: User = {
        id: `u${Date.now()}`,
        name: newMember.name,
        email: newMember.email || `${newMember.name.toLowerCase().replace(' ', '.')}@wmhi.co.uk`,
        role: newMember.role as any,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}` // Generate random avatar
    };

    setUsers([...users, newUser]);
    setIsAddUserModalOpen(false);
    setNewMember({ name: '', role: 'Builder', email: '' });
  };

  const handleRemoveUser = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          setRemoveUserModalState({ isOpen: true, user });
          setActiveTeamMenuId(null);
      }
  };

  const confirmRemoveUser = () => {
      if (removeUserModalState.user) {
          setUsers(prev => prev.filter(u => u.id !== removeUserModalState.user!.id));
          setRemoveUserModalState({ isOpen: false, user: null });
      }
  };

  const handleResetPassword = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          setResetPasswordState({ isOpen: true, user, newPass: '' });
          setActiveTeamMenuId(null);
      }
  };

  const submitPasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if(resetPasswordState.user && resetPasswordState.newPass) {
          // In a real app, update logic here.
          // For now, we just close it and show confirmation
          setResetPasswordState({ isOpen: false, user: null, newPass: '' });
          alert(`Password updated successfully for ${resetPasswordState.user.name}`);
      }
  };

  const renderContent = () => {
    if (!currentUser) return null;

    // If a job is selected, show detail view (overrides standard views unless back is pressed)
    if (selectedJob && currentView === View.JOBS) {
      return (
        <JobDetail 
          job={selectedJob} 
          currentUser={currentUser}
          allUsers={users}
          onBack={() => setSelectedJob(null)}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
        />
      );
    }

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard jobs={visibleJobs} onSelectJob={handleSelectJob} currentUser={currentUser} />;
      case View.JOBS:
        return <JobBoard jobs={visibleJobs} onSelectJob={handleSelectJob} onAddJob={handleAddJob} />;
      case View.MESSAGES:
        return (
          <UnifiedInbox 
            jobs={visibleJobs} 
            onSelectJob={handleSelectJob} 
            currentUser={currentUser}
            allUsers={users}
          />
        );
      case View.TASKS:
        return (
            <TaskBoard 
                tasks={tasks}
                jobs={visibleJobs}
                currentUser={currentUser}
                allUsers={users}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
            />
        );
      case View.TEAM:
        return (
          <div className="p-8 relative">
            {/* Add Member Modal */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-wmhi-blue px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> Add Team Member</h3>
                            <button onClick={() => setIsAddUserModalOpen(false)} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue"
                                    value={newMember.name}
                                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                                    required
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue"
                                    value={newMember.email}
                                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                                    placeholder="john@wmhi.co.uk"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                                <select 
                                    className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue"
                                    value={newMember.role}
                                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                                >
                                    <option value="Site Manager">Site Manager</option>
                                    <option value="Builder">Builder</option>
                                    <option value="Electrician">Electrician</option>
                                    <option value="Plumber">Plumber</option>
                                    <option value="Surveyor">Surveyor</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-2 bg-wmhi-red hover:bg-wmhi-redHover text-white rounded font-bold shadow-sm mt-2 transition-transform active:scale-95">
                                Add Member
                            </button>
                        </form>
                    </div>
                </div>
            )}

             {/* Remove User Modal */}
             {removeUserModalState.isOpen && removeUserModalState.user && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Team Member?</h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                Are you sure you want to remove <span className="font-bold text-slate-700">{removeUserModalState.user.name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setRemoveUserModalState({ isOpen: false, user: null })} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
                                <button onClick={confirmRemoveUser} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-sm">Yes, Remove User</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordState.isOpen && resetPasswordState.user && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-wmhi-blue px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><KeyRound size={20}/> Change Password</h3>
                            <button onClick={() => setResetPasswordState({ ...resetPasswordState, isOpen: false })} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={submitPasswordReset} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                                    {resetPasswordState.user.avatar ? <img src={resetPasswordState.user.avatar} className="w-full h-full object-cover"/> : resetPasswordState.user.name.charAt(0)}
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-slate-900">{resetPasswordState.user.name}</p>
                                     <p className="text-xs text-slate-500">{resetPasswordState.user.email}</p>
                                 </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full bg-white text-slate-900 p-2 border rounded focus:ring-wmhi-blue focus:border-wmhi-blue"
                                    value={resetPasswordState.newPass}
                                    onChange={e => setResetPasswordState({...resetPasswordState, newPass: e.target.value})}
                                    required
                                    placeholder="Enter new password"
                                    minLength={4}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Type the new password for the user.</p>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setResetPasswordState({ ...resetPasswordState, isOpen: false })} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded font-medium text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-wmhi-blue hover:bg-blue-800 text-white rounded font-bold shadow-sm text-sm">
                                    Set Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold mb-6 text-wmhi-blue">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative group">
                  
                  {/* Admin Actions Menu Trigger */}
                  {currentUser.role === 'Admin' && currentUser.id !== user.id && (
                     <div className="absolute top-3 right-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveTeamMenuId(activeTeamMenuId === user.id ? null : user.id); }}
                          className="p-1 text-slate-300 hover:text-wmhi-blue rounded-full hover:bg-slate-50 transition-colors"
                        >
                           <MoreVertical size={16} />
                        </button>
                        
                        {/* Dropdown */}
                        {activeTeamMenuId === user.id && (
                           <>
                             <div className="fixed inset-0 z-10" onClick={() => setActiveTeamMenuId(null)}></div>
                             <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 text-sm animate-in fade-in zoom-in-95 duration-200">
                                <button 
                                  onClick={() => handleResetPassword(user.id)}
                                  className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-wmhi-blue flex items-center gap-2"
                                >
                                  <KeyRound size={14}/> Reset Password
                                </button>
                                <button 
                                  onClick={() => handleRemoveUser(user.id)}
                                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={14}/> Remove User
                                </button>
                             </div>
                           </>
                        )}
                     </div>
                  )}

                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 overflow-hidden flex-shrink-0">
                     {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-wmhi-blue">{user.name}</h3>
                    <p className="text-xs text-slate-400 mb-1 truncate max-w-[150px]">{user.email}</p>
                    <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{user.role}</span>
                  </div>
                </div>
              ))}
              
              {currentUser.role === 'Admin' && (
                  <button 
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:text-wmhi-blue hover:border-wmhi-blue hover:bg-blue-50 transition-all group min-h-[100px]"
                  >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-white text-slate-400 group-hover:text-wmhi-blue transition-colors">
                        <Plus size={24} />
                      </div>
                      <span className="font-bold text-sm">+ Add New Member</span>
                  </button>
              )}
            </div>
          </div>
        );
      case View.SETTINGS:
        return <Settings currentUser={currentUser} />;
      default:
        return <Dashboard jobs={visibleJobs} onSelectJob={handleSelectJob} currentUser={currentUser} />;
    }
  };

  if (loading) return null;

  // Not Authenticated
  if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  // Authenticated
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-wmhi-blue/95 z-40 md:hidden flex flex-col p-6 text-white animate-in slide-in-from-right duration-200">
          <div className="flex justify-end mb-8">
            <button onClick={() => setMobileMenuOpen(false)}><X size={28}/></button>
          </div>
          <nav className="space-y-6 text-xl font-medium">
             <button onClick={() => {setCurrentView(View.DASHBOARD); setMobileMenuOpen(false); setSelectedJob(null);}}>Dashboard</button>
             <button onClick={() => {setCurrentView(View.JOBS); setMobileMenuOpen(false);}}>Projects</button>
             <button onClick={() => {setCurrentView(View.MESSAGES); setMobileMenuOpen(false); setSelectedJob(null);}}>Messages</button>
             <button onClick={() => {setCurrentView(View.TASKS); setMobileMenuOpen(false); setSelectedJob(null);}}>Tasks</button>
             <button onClick={() => {setCurrentView(View.TEAM); setMobileMenuOpen(false); setSelectedJob(null);}}>Team</button>
             <button onClick={() => {setCurrentView(View.SETTINGS); setMobileMenuOpen(false); setSelectedJob(null);}}>Settings</button>
             
             <div className="pt-8 border-t border-white/20">
                <button 
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} 
                    className="text-red-300 flex items-center gap-3"
                >
                    <LogOut size={20}/> Sign Out
                </button>
             </div>
          </nav>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { setCurrentView(view); setSelectedJob(null); }} 
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen flex flex-col">
        {/* Mobile Header (Only visible on mobile) */}
        {!selectedJob && (
          <div className="md:hidden bg-wmhi-blue text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
            <div className="flex flex-col">
               <span className="font-bold text-lg tracking-wider leading-none">WEST MIDLANDS</span>
               <span className="text-[10px] text-red-400 tracking-widest uppercase leading-none mt-0.5">Home Improvements</span>
            </div>
            <button onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        )}

        {/* Content View */}
        <div className="flex-1 h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
