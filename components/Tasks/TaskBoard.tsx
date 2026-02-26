
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, User, Job, TaskPriority, TaskStatus, TaskActivity, TaskAttachment } from '../../types';
import { Plus, CheckSquare, Calendar, AlertCircle, Search, User as UserIcon, Building2, UserCircle2, Briefcase, X, Trash2, Filter, Clock, Pencil, ChevronDown, ChevronRight, Paperclip, FileText, Image as ImageIcon, Film, History, Send, Eye } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  jobs: Job[];
  currentUser: User;
  allUsers: User[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

type TaskType = 'project' | 'individual' | 'self';
type ModalTab = 'details' | 'attachments' | 'activity';

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, jobs, currentUser, allUsers, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dashboard Viewing State (Admins can view others)
  const [viewingUserId, setViewingUserId] = useState(currentUser.id);
  
  // Ensure viewingUserId resets if currentUser changes or logic dictates
  useEffect(() => {
    if (currentUser.role !== 'Admin') {
        setViewingUserId(currentUser.id);
    }
  }, [currentUser]);

  // View State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  
  // Collapsible Groups State
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
      completed: true // Collapse completed by default
  });

  // Modal Form State
  const [taskType, setTaskType] = useState<TaskType>('self'); 
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: new Date().toISOString().split('T')[0],
    activityLog: [],
    attachments: []
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // --- Helpers ---
  const getAssigneeName = (id: string) => allUsers.find(u => u.id === id)?.name || 'Unknown';
  const getProjectAddress = (id?: string) => jobs.find(j => j.id === id)?.address || 'General Task';
  
  const getUserDetails = (id: string) => allUsers.find(u => u.id === id) || { name: 'Unknown User', avatar: '' };
  
  const viewingUser = useMemo(() => allUsers.find(u => u.id === viewingUserId) || currentUser, [viewingUserId, allUsers, currentUser]);

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
        case TaskPriority.URGENT: return 'bg-red-100 text-red-700 border-red-200';
        case TaskPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
        case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200';
        case TaskPriority.LOW: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isOverdue = (task: Task) => {
      if (task.status === TaskStatus.COMPLETED) return false;
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate < today;
  };

  // --- Filtering & Grouping Logic ---
  const matchesFilters = (t: Task) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'pending' ? t.status !== TaskStatus.COMPLETED : t.status === TaskStatus.COMPLETED);
    
    return matchesSearch && matchesPriority && matchesStatus;
  };

  // Filter based on the VIEWING USER, not necessarily the current user
  const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === viewingUserId && matchesFilters(t)), [tasks, viewingUserId, searchQuery, priorityFilter, statusFilter]);
  const delegatedTasks = useMemo(() => tasks.filter(t => t.assignedBy === viewingUserId && t.assignedTo !== viewingUserId && matchesFilters(t)), [tasks, viewingUserId, searchQuery, priorityFilter, statusFilter]);

  // Group My Tasks by Date
  const myTaskGroups = useMemo(() => {
    const groups = {
        overdue: [] as Task[],
        today: [] as Task[],
        tomorrow: [] as Task[],
        upcoming: [] as Task[],
        completed: [] as Task[]
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    myTasks.forEach(task => {
        if (task.status === TaskStatus.COMPLETED) {
            groups.completed.push(task);
            return;
        }

        if (task.dueDate < todayStr) {
            groups.overdue.push(task);
        } else if (task.dueDate === todayStr) {
            groups.today.push(task);
        } else if (task.dueDate === tomorrowStr) {
            groups.tomorrow.push(task);
        } else {
            groups.upcoming.push(task);
        }
    });

    const priorityWeight = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
    const sorter = (a: Task, b: Task) => priorityWeight[b.priority] - priorityWeight[a.priority];
    
    groups.overdue.sort(sorter);
    groups.today.sort(sorter);
    groups.tomorrow.sort(sorter);
    groups.upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return groups;
  }, [myTasks]);


  // --- Logic Helpers ---

  // Helper to update a task and append a log entry automatically
  const updateTaskWithLog = (task: Task, changeType: TaskActivity['type'], details: string) => {
      const newActivity: TaskActivity = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: changeType,
          details: details,
          timestamp: new Date()
      };

      const updatedTask = {
          ...task,
          activityLog: [newActivity, ...(task.activityLog || [])]
      };

      onUpdateTask(updatedTask);
      
      // If we are currently editing this task, update local state too
      if (editingTaskId === task.id) {
          setNewTask(updatedTask);
      }
  };


  // --- Handlers ---
  const handleOpenCreateModal = () => {
      setEditingTaskId(null);
      resetModalState();
      setActiveTab('details');
      setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
      setEditingTaskId(task.id);
      setNewTask({
          ...task,
          activityLog: task.activityLog || [], // Ensure array exists
          attachments: task.attachments || []
      });
      setActiveTab('details');

      if (task.projectId) {
          setTaskType('project');
          setSelectedProjectId(task.projectId);
          setSelectedUserId(task.assignedTo);
      } else {
          if (task.assignedTo === currentUser.id) {
               setTaskType('self');
               setSelectedProjectId('');
               setSelectedUserId('');
          } else {
               setTaskType('individual');
               setSelectedUserId(task.assignedTo);
               setSelectedProjectId('');
          }
      }
      setIsModalOpen(true);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    let assignedTo = '';
    let projectId: string | undefined = undefined;

    if (taskType === 'self') {
        assignedTo = currentUser.id;
    } else if (taskType === 'individual') {
        if (!selectedUserId) return; 
        assignedTo = selectedUserId;
    } else if (taskType === 'project') {
        if (!selectedProjectId || !selectedUserId) return; 
        assignedTo = selectedUserId;
        projectId = selectedProjectId;
    }

    if (!newTask.title || !assignedTo) return;

    if (editingTaskId) {
        // UPDATE Existing
        const taskToUpdate = tasks.find(t => t.id === editingTaskId);
        if (taskToUpdate) {
            // Check for major changes to log
            const changes = [];
            if (newTask.priority !== taskToUpdate.priority) changes.push(`Priority changed to ${newTask.priority}`);
            if (newTask.assignedTo !== taskToUpdate.assignedTo) changes.push(`Reassigned to ${getAssigneeName(assignedTo)}`);
            if (newTask.dueDate !== taskToUpdate.dueDate) changes.push(`Due date changed to ${newTask.dueDate}`);

            // Create log entries for changes
            const newLogs = changes.map((detail, idx) => ({
                id: `${Date.now()}-${idx}`,
                userId: currentUser.id,
                type: 'update' as const,
                details: detail,
                timestamp: new Date()
            }));

            const updatedTask: Task = {
                ...taskToUpdate,
                title: newTask.title || taskToUpdate.title,
                description: newTask.description,
                assignedTo,
                projectId,
                priority: newTask.priority as TaskPriority,
                dueDate: newTask.dueDate || taskToUpdate.dueDate,
                activityLog: [...newLogs, ...(taskToUpdate.activityLog || [])]
            };
            onUpdateTask(updatedTask);
        }
    } else {
        // CREATE New
        const initialLog: TaskActivity = {
            id: Date.now().toString(),
            userId: currentUser.id,
            type: 'creation',
            details: 'Task created',
            timestamp: new Date()
        };

        const task: Task = {
            id: Date.now().toString(),
            title: newTask.title || 'Untitled Task',
            description: newTask.description,
            assignedTo,
            assignedBy: currentUser.id,
            projectId,
            status: TaskStatus.PENDING,
            priority: newTask.priority as TaskPriority,
            dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
            createdAt: new Date(),
            activityLog: [initialLog],
            attachments: []
        };
        onAddTask(task);
    }

    resetModalState();
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Determine type
          let type: TaskAttachment['type'] = 'document';
          if (file.type.startsWith('image/')) type = 'image';
          if (file.type.startsWith('video/')) type = 'video';

          const newAttachment: TaskAttachment = {
              id: Date.now().toString(),
              name: file.name,
              type,
              url: URL.createObjectURL(file), // Temporary object URL for demo
              uploadedBy: currentUser.id,
              uploadedAt: new Date()
          };

          const newActivity: TaskActivity = {
              id: Date.now().toString() + '_log',
              userId: currentUser.id,
              type: 'upload',
              details: `Uploaded ${file.name}`,
              timestamp: new Date()
          };

          // Update local state (newTask) and parent state immediately if editing
          if (editingTaskId) {
               const updatedTask = {
                   ...newTask as Task,
                   attachments: [newAttachment, ...(newTask.attachments || [])],
                   activityLog: [newActivity, ...(newTask.activityLog || [])]
               };
               setNewTask(updatedTask);
               onUpdateTask(updatedTask);
          }
          
          if (e.target) e.target.value = '';
      }
  };

  const resetModalState = () => {
    setTaskType('self');
    setNewTask({ title: '', description: '', priority: TaskPriority.MEDIUM, dueDate: new Date().toISOString().split('T')[0], activityLog: [], attachments: [] });
    setSelectedProjectId('');
    setSelectedUserId('');
  };

  const toggleStatus = (task: Task) => {
      const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
      updateTaskWithLog(task, 'status_change', `Marked as ${newStatus}`);
  };

  const toggleGroupCollapse = (group: string) => {
      setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getAssignableUsers = () => {
      if (taskType === 'individual') return allUsers;
      if (taskType === 'project' && selectedProjectId) {
          const job = jobs.find(j => j.id === selectedProjectId);
          if (!job) return [];
          return allUsers.filter(u => job.assignedTeam.includes(u.id) || u.role === 'Admin');
      }
      return [];
  };

  // --- UI Components ---
  const renderAttachmentsTab = () => (
      <div className="space-y-4 h-96 overflow-y-auto pr-2">
          {(!newTask.attachments || newTask.attachments.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Paperclip className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-500 text-sm">No attachments yet.</p>
              </div>
          ) : (
              <div className="grid grid-cols-2 gap-3">
                  {newTask.attachments.map(att => (
                      <div key={att.id} className="border border-slate-200 rounded-lg p-2 flex items-center gap-3 bg-white hover:bg-slate-50 transition-colors group">
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 overflow-hidden">
                              {att.type === 'image' && <img src={att.url} className="w-full h-full object-cover" />}
                              {att.type === 'video' && <Film size={18} />}
                              {att.type === 'document' && <FileText size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate" title={att.name}>{att.name}</p>
                              <p className="text-[10px] text-slate-400">
                                  {new Date(att.uploadedAt).toLocaleDateString()} by {getAssigneeName(att.uploadedBy).split(' ')[0]}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-slate-100">
              <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-wmhi-blue hover:border-wmhi-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                  <Plus size={16}/> Upload File
              </button>
          </div>
      </div>
  );

  const renderActivityTab = () => (
      <div className="space-y-6 h-96 overflow-y-auto pr-2 pt-2">
          {(!newTask.activityLog || newTask.activityLog.length === 0) ? (
              <div className="text-center py-12 text-slate-400">No activity recorded.</div>
          ) : (
              newTask.activityLog.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, index) => {
                  const user = getUserDetails(log.userId);
                  return (
                      <div key={log.id} className="relative pl-6 pb-2">
                          {/* Timeline Line */}
                          {index !== newTask.activityLog!.length - 1 && (
                              <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-slate-200"></div>
                          )}
                          {/* Timeline Dot */}
                          <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${
                              log.type === 'creation' ? 'border-green-500 text-green-500' :
                              log.type === 'status_change' ? 'border-wmhi-blue text-wmhi-blue' :
                              log.type === 'upload' ? 'border-orange-500 text-orange-500' :
                              'border-slate-400 text-slate-400'
                          }`}>
                              {log.type === 'upload' ? <Paperclip size={10}/> : <History size={10}/>}
                          </div>
                          
                          <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-800">{user.name}</span>
                                  <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-sm text-slate-600 mt-0.5">{log.details}</p>
                          </div>
                      </div>
                  );
              })
          )}
      </div>
  );

  const renderTaskCard = (task: Task, isDelegatedView = false) => (
    <div 
        key={task.id} 
        onClick={() => handleOpenEditModal(task)}
        className={`group p-4 border rounded-xl transition-all duration-200 bg-white hover:shadow-md mb-3 cursor-pointer ${task.status === TaskStatus.COMPLETED ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}
    >
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
                {!isDelegatedView && (
                    <button 
                    onClick={(e) => { e.stopPropagation(); toggleStatus(task); }}
                    className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        task.status === TaskStatus.COMPLETED 
                        ? 'bg-green-500 border-green-500 text-white scale-110' 
                        : 'border-slate-300 hover:border-wmhi-blue hover:bg-blue-50 text-transparent'
                    }`}
                    >
                        <CheckSquare size={12} strokeWidth={4} />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <span className={`font-bold text-sm block truncate ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                    </span>
                    <div className="flex gap-1 mt-1">
                         {isDelegatedView && (
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {task.status}
                             </span>
                         )}
                         <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.attachments?.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                <Paperclip size={8}/> {task.attachments.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteTask && onDeleteTask(task.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Task"
               >
                  <Trash2 size={14}/>
               </button>
            </div>
        </div>
        
        {task.description && (
            <p className="text-xs text-slate-500 mb-3 pl-8 leading-relaxed line-clamp-2">{task.description}</p>
        )}
        
        <div className={`flex items-center justify-between text-xs border-t border-slate-50 pt-2 ${!isDelegatedView ? 'pl-8' : ''}`}>
            <div className="flex items-center gap-2 text-slate-500 truncate max-w-[60%]">
                {task.projectId ? (
                    <span className="flex items-center gap-1 hover:text-wmhi-blue transition-colors cursor-default truncate" title={getProjectAddress(task.projectId)}>
                        <Building2 size={12} className="flex-shrink-0"/> <span className="truncate">{getProjectAddress(task.projectId)}</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-1"><UserCircle2 size={12}/> Personal</span>
                )}
                {isDelegatedView && (
                     <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">
                        <UserIcon size={10}/> {getAssigneeName(task.assignedTo)}
                     </span>
                )}
            </div>
            <div className={`flex items-center gap-1 font-medium ${isOverdue(task) && !isDelegatedView ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-slate-400'}`}>
                {isOverdue(task) && <AlertCircle size={10}/>}
                <Calendar size={12}/> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
        </div>
    </div>
  );

  const renderTaskGroup = (title: string, groupTasks: Task[], groupId: string, colorClass: string, icon: React.ReactNode) => {
     if (groupTasks.length === 0) return null;
     const isCollapsed = collapsedGroups[groupId];

     return (
        <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
            <button 
                onClick={() => toggleGroupCollapse(groupId)}
                className={`w-full flex items-center justify-between mb-3 group`}
            >
                <div className={`flex items-center gap-2 font-bold text-sm uppercase tracking-wide ${colorClass}`}>
                    {icon}
                    {title}
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{groupTasks.length}</span>
                </div>
                <div className="h-px bg-slate-200 flex-1 ml-4 group-hover:bg-slate-300 transition-colors"></div>
                <div className="ml-2 text-slate-400 group-hover:text-slate-600">
                    {isCollapsed ? <ChevronRight size={16}/> : <ChevronDown size={16}/>}
                </div>
            </button>
            
            {!isCollapsed && (
                <div className="space-y-1">
                    {groupTasks.map(t => renderTaskCard(t, false))}
                </div>
            )}
        </div>
     );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* --- TASK MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="bg-wmhi-blue px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {editingTaskId ? <Pencil size={18}/> : <Plus size={20}/>} 
                        {editingTaskId ? 'Task Details' : 'Set New Task'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors"><X size={20}/></button>
                </div>

                {/* Tabs (Only if editing) */}
                {editingTaskId && (
                    <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
                        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-wmhi-blue text-wmhi-blue bg-white' : 'border-transparent text-slate-500'}`}>Details</button>
                        <button onClick={() => setActiveTab('attachments')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'attachments' ? 'border-wmhi-blue text-wmhi-blue bg-white' : 'border-transparent text-slate-500'}`}>Attachments</button>
                        <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'activity' ? 'border-wmhi-blue text-wmhi-blue bg-white' : 'border-transparent text-slate-500'}`}>Activity</button>
                    </div>
                )}
                
                <form onSubmit={handleSubmitTask} className="p-6 overflow-y-auto flex-1">
                    
                    {activeTab === 'attachments' && renderAttachmentsTab()}
                    
                    {activeTab === 'activity' && renderActivityTab()}

                    {activeTab === 'details' && (
                        <>
                            {/* Type Selector Tabs (Only show if creating new) */}
                            {!editingTaskId && (
                                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                                    {(['self', 'project', 'individual'] as TaskType[]).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setTaskType(type)}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md capitalize transition-all duration-200 flex items-center justify-center gap-2 ${
                                                taskType === type 
                                                ? 'bg-white text-wmhi-blue shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {type === 'self' && <CheckSquare size={14}/>}
                                            {type === 'project' && <Briefcase size={14}/>}
                                            {type === 'individual' && <UserCircle2 size={14}/>}
                                            {type === 'self' ? 'Myself' : type}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Dynamic Fields */}
                                {(taskType === 'project' || (editingTaskId && newTask.projectId)) && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Project</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-wmhi-blue focus:border-wmhi-blue text-slate-900 outline-none transition-all truncate"
                                                value={selectedProjectId}
                                                onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedUserId(''); }}
                                                required
                                                disabled={!!editingTaskId} // Lock project on edit for simplicity
                                            >
                                                <option value="">-- Choose Project --</option>
                                                {jobs.map(job => (
                                                    <option key={job.id} value={job.id}>{job.address} ({job.clientName})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {(taskType === 'individual' || (taskType === 'project' && selectedProjectId) || (editingTaskId && newTask.assignedTo !== currentUser.id)) && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign To</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-wmhi-blue focus:border-wmhi-blue text-slate-900 outline-none transition-all truncate"
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Choose Team Member --</option>
                                                {getAssignableUsers().map(user => (
                                                    <option key={user.id} value={user.id}>{user.name} - {user.role}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Core Fields */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Title</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-wmhi-blue focus:border-wmhi-blue text-slate-900 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                        required
                                        autoFocus={!editingTaskId}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-wmhi-blue focus:border-wmhi-blue text-slate-900 outline-none transition-all"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-wmhi-blue focus:border-wmhi-blue text-slate-900 outline-none transition-all"
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                                        >
                                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
                                    <textarea 
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-wmhi-blue focus:border-wmhi-blue resize-none h-24 text-slate-900 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Add specific details, quantities, or context..."
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                
                    {/* Footer Actions */}
                    {activeTab === 'details' && (
                        <div className="pt-6 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-2.5 bg-wmhi-blue text-white rounded-lg font-bold hover:bg-blue-800 shadow-md transform active:scale-95 transition-all">
                                {editingTaskId ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
      )}

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-wmhi-blue flex items-center gap-2">
            Task Manager
            {currentUser.role === 'Admin' && viewingUserId !== currentUser.id && (
                <span className="text-slate-400 font-normal text-lg flex items-center gap-1">
                    <span className="text-slate-300">/</span> 
                    <UserCircle2 size={18}/> {viewingUser.name}'s Board
                </span>
            )}
          </h2>
          <p className="text-slate-500">Organize schedule and delegate work.</p>
        </div>
        
        <div className="flex items-center gap-2">
            {currentUser.role === 'Admin' && (
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Eye size={16} />
                    </div>
                    <select 
                        value={viewingUserId}
                        onChange={(e) => setViewingUserId(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-wmhi-blue shadow-sm appearance-none cursor-pointer hover:border-blue-300 transition-colors min-w-[180px]"
                    >
                        <option value={currentUser.id}>View My Board</option>
                        <optgroup label="View Team Member">
                            {allUsers.filter(u => u.id !== currentUser.id).map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            )}
            
            <button 
            onClick={handleOpenCreateModal}
            className="bg-wmhi-red hover:bg-wmhi-redHover text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all hover:shadow-md flex items-center gap-2 whitespace-nowrap"
            >
            <Plus size={18} /> New Task
            </button>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Search tasks..." 
                className="w-full pl-10 pr-4 py-2 bg-transparent text-slate-900 focus:outline-none text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-2">
             <div className="flex items-center bg-slate-50 rounded-lg px-2 py-1">
                 <Filter size={14} className="text-slate-400 mr-2"/>
                 <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer p-1"
                 >
                    <option value="all">All Priorities</option>
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
             </div>
             <div className="flex bg-slate-100 rounded-lg p-1">
                 <button 
                    onClick={() => setStatusFilter('all')} 
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white shadow text-wmhi-blue' : 'text-slate-500'}`}
                 >All</button>
                 <button 
                    onClick={() => setStatusFilter('pending')} 
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${statusFilter === 'pending' ? 'bg-white shadow text-wmhi-blue' : 'text-slate-500'}`}
                 >Pending</button>
                 <button 
                    onClick={() => setStatusFilter('completed')} 
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${statusFilter === 'completed' ? 'bg-white shadow text-wmhi-blue' : 'text-slate-500'}`}
                 >Done</button>
             </div>
          </div>
      </div>

      {/* --- COLUMNS --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
          
          {/* COLUMN 1: MY TASKS (Grouped) */}
          <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-[calc(100vh-280px)]">
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
                  <h3 className="font-bold text-wmhi-blue flex items-center gap-2">
                      <div className="bg-blue-100 p-1.5 rounded text-wmhi-blue"><CheckSquare size={16}/></div>
                      {viewingUserId === currentUser.id ? 'My Tasks' : `${viewingUser.name.split(' ')[0]}'s Tasks`}
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full ml-2">{myTasks.length}</span>
                  </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                  {myTasks.length === 0 ? (
                      <div className="text-center py-20 opacity-50 flex flex-col items-center">
                          <CheckSquare size={48} className="text-slate-300 mb-3"/>
                          <p className="text-sm font-medium text-slate-400">
                              {viewingUserId === currentUser.id ? "You're all caught up!" : `${viewingUser.name.split(' ')[0]} is all caught up!`}
                          </p>
                          <button onClick={handleOpenCreateModal} className="mt-4 text-wmhi-blue text-sm font-bold hover:underline">Create a task</button>
                      </div>
                  ) : (
                      <>
                        {renderTaskGroup('Overdue', myTaskGroups.overdue, 'overdue', 'text-red-600', <AlertCircle size={14}/>)}
                        {renderTaskGroup('Today', myTaskGroups.today, 'today', 'text-wmhi-blue', <Calendar size={14}/>)}
                        {renderTaskGroup('Tomorrow', myTaskGroups.tomorrow, 'tomorrow', 'text-orange-600', <Clock size={14}/>)}
                        {renderTaskGroup('Upcoming', myTaskGroups.upcoming, 'upcoming', 'text-slate-600', <Calendar size={14}/>)}
                        {renderTaskGroup('Completed', myTaskGroups.completed, 'completed', 'text-green-600', <CheckSquare size={14}/>)}
                      </>
                  )}
              </div>
          </div>

          {/* COLUMN 2: DELEGATED (Flat List) */}
          <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-[calc(100vh-280px)]">
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <div className="bg-slate-100 p-1.5 rounded text-slate-600"><Briefcase size={16}/></div>
                      {viewingUserId === currentUser.id ? 'Delegated Tasks' : `Delegated by ${viewingUser.name.split(' ')[0]}`}
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full ml-2">{delegatedTasks.length}</span>
                  </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {delegatedTasks.length === 0 ? (
                      <div className="text-center py-20 opacity-50 flex flex-col items-center">
                          <Briefcase size={48} className="text-slate-300 mb-3"/>
                          <p className="text-sm font-medium text-slate-400">No delegated tasks.</p>
                      </div>
                  ) : (
                      delegatedTasks.map(task => renderTaskCard(task, true))
                  )}
              </div>
          </div>

      </div>

    </div>
  );
};

export default TaskBoard;
