
import React, { useState, useEffect, useRef } from 'react';
import { Job, Message, Note, User, JOB_STAGES, JobStage, JobStatus } from '../../types';
import { ArrowLeft, Send, Paperclip, Camera, Bot, Sparkles, MoreVertical, Phone, Plus, X, Calendar, Upload, Image as ImageIcon, FileText, Trash2, Clock, StickyNote, Search, MessageSquare, CheckCircle2, XCircle, PlayCircle, AlertTriangle, Copy, Loader2, Mail } from 'lucide-react';
import { summarizeJobChat, draftClientUpdate } from '../../services/geminiService';

interface JobDetailProps {
  job: Job;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  onUpdateJob: (updatedJob: Job) => void;
  onDeleteJob: (jobId: string) => void;
}

const JobDetail: React.FC<JobDetailProps> = ({ job, currentUser, allUsers, onBack, onUpdateJob, onDeleteJob }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'diary'>('chat');
  const [messageText, setMessageText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [diarySearch, setDiarySearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiTitle, setAiTitle] = useState('');

  // Initialize state with props
  const [messages, setMessages] = useState<Message[]>(job.messages);
  const [notes, setNotes] = useState<Note[]>(job.siteNotes || []);
  const [localJob, setLocalJob] = useState<Job>(job);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plansInputRef = useRef<HTMLInputElement>(null);
  const calcsInputRef = useRef<HTMLInputElement>(null);
  const glazingFormInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message or tab change (only if not searching)
  useEffect(() => {
    if (activeTab === 'chat' && !chatSearch) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, chatSearch]);

  // Sync state when switching jobs
  useEffect(() => {
    if (job.id !== localJob.id) {
        setLocalJob(job);
        setMessages(job.messages);
        setNotes(job.siteNotes || []);
    }
  }, [job, localJob.id]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: messageText,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => {
        const updated = [...prev, newMessage];
        const updatedJob = { ...localJob, messages: updated };
        setLocalJob(updatedJob);
        onUpdateJob(updatedJob);
        return updated;
    });

    setMessageText('');
    setChatSearch('');
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    const newNote: Note = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: noteText,
        timestamp: new Date()
    };

    setNotes(prev => {
        const updated = [newNote, ...prev];
        const updatedJob = { ...localJob, siteNotes: updated };
        setLocalJob(updatedJob);
        onUpdateJob(updatedJob);
        return updated;
    });

    setNoteText('');
    setDiarySearch('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTimeout(() => {
        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            text: `Uploaded photo: ${file.name}`,
            timestamp: new Date(),
            type: 'text' 
        };
        
        setMessages(prev => {
            const updated = [...prev, newMessage];
            setLocalJob(currentJob => {
                const newJob = { ...currentJob, messages: updated };
                onUpdateJob(newJob);
                return newJob;
            });
            return updated;
        });
      }, 500);
    }
  };

  const handleDocumentUpload = (field: 'architectPlans' | 'structuralCalculations') => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const currentDocs = localJob[field] || [];
          const updatedDocs = [...currentDocs, file.name];
          handleUpdateField(field, updatedDocs);
          if (e.target) e.target.value = '';
      }
  };

  const handleSingleFileUpload = (field: keyof Job) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          handleUpdateField(field, file.name);
          if (e.target) e.target.value = '';
      }
  };

  const removeDocument = (field: 'architectPlans' | 'structuralCalculations', index: number) => {
      const currentDocs = localJob[field] || [];
      const updatedDocs = currentDocs.filter((_, i) => i !== index);
      handleUpdateField(field, updatedDocs);
  };

  const handleUpdateField = (field: keyof Job, value: any) => {
    const updatedJob = { ...localJob, [field]: value };
    setLocalJob(updatedJob);
    onUpdateJob(updatedJob);
  };

  const getUserDetails = (userId: string) => allUsers.find(u => u.id === userId) || { name: 'Unknown', avatar: '' };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDeleteJob(job.id);
  };

  const handleStatusChange = (status: JobStatus) => {
      setIsMenuOpen(false);
      handleUpdateField('status', status);
  };

  // --- AI Handlers ---
  const triggerAiSummary = async () => {
      setAiTitle('Project Chat Summary');
      setAiLoading(true);
      setShowAiModal(true);
      const summary = await summarizeJobChat(localJob);
      setAiResult(summary);
      setAiLoading(false);
  };

  const triggerAiDraft = async () => {
      setIsMenuOpen(false);
      setAiTitle('Client Update Draft');
      setAiLoading(true);
      setShowAiModal(true);
      
      const recentNotes = notes.slice(0, 5).map(n => n.content).join('\n');
      const draft = await draftClientUpdate(localJob, recentNotes || 'No recent site notes recorded.');
      setAiResult(draft);
      setAiLoading(false);
  };

  const filteredNotes = notes.filter(note => {
    const user = getUserDetails(note.userId);
    const searchLower = diarySearch.toLowerCase();
    return (
      note.content.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower)
    );
  });

  const filteredMessages = messages.filter(msg => {
    const searchLower = chatSearch.toLowerCase();
    const senderName = msg.senderId === 'u1' ? 'WMHI OFFICE' : 'Site Team';
    return (
        msg.text.toLowerCase().includes(searchLower) ||
        senderName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <Trash2 size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Project?</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Are you sure you want to delete <span className="font-bold text-slate-700">{localJob.address}</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-sm">Yes, Delete Project</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* AI Result Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-300"/> {aiTitle}
                    </h3>
                    <button onClick={() => setShowAiModal(false)} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {aiLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Loader2 size={32} className="animate-spin mb-3 text-wmhi-blue"/>
                            <p className="text-sm font-medium">Analyzing project data with Gemini...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {aiResult}
                        </div>
                    )}
                </div>
                {!aiLoading && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                        <button 
                            onClick={() => { navigator.clipboard.writeText(aiResult); }}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Copy size={16}/> Copy Text
                        </button>
                        <button onClick={() => setShowAiModal(false)} className="px-4 py-2 bg-wmhi-blue text-white rounded-lg text-sm font-bold hover:bg-blue-800">Done</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-30 relative">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
             <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-wmhi-blue">{localJob.address}</h2>
                 <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                     localJob.status === JobStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 
                     localJob.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                 }`}>{localJob.currentStage || localJob.status}</span>
             </div>
             <p className="text-xs text-slate-400 uppercase tracking-wide">Project Management {'>'} Projects</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
                className="text-slate-400 hover:text-wmhi-blue p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <MoreVertical size={20}/>
            </button>
            
            {/* Context Menu */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <button 
                            onClick={triggerAiDraft}
                            className="w-full text-left px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 border-b border-slate-100 font-medium"
                        >
                            <Sparkles size={16}/> AI Draft Client Update
                        </button>
                        <button 
                            onClick={() => handleStatusChange(JobStatus.IN_PROGRESS)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                        >
                            <PlayCircle size={16} className="text-blue-600"/> Set In Progress
                        </button>
                        <button 
                            onClick={() => handleStatusChange(JobStatus.COMPLETED)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                        >
                            <CheckCircle2 size={16} className="text-green-600"/> Mark Completed
                        </button>
                        <button 
                            onClick={() => handleStatusChange(JobStatus.CANCELLED)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                        >
                            <XCircle size={16} className="text-slate-400"/> Mark Cancelled
                        </button>
                        {currentUser.role === 'Admin' && (
                            <button 
                                type="button"
                                onClick={handleDeleteClick}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                                <Trash2 size={16}/> Delete Project
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Detailed Info Form */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                
                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12">
                    
                    {/* Row 1 */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Project Address</div>
                    <div className="md:col-span-2">
                        <input 
                            type="text" 
                            className="w-full bg-transparent text-lg font-semibold text-slate-900 border-b border-slate-200 focus:border-wmhi-blue focus:outline-none pb-1"
                            value={localJob.address}
                            onChange={(e) => handleUpdateField('address', e.target.value)}
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Customer Name</div>
                    <div className="md:col-span-2">
                        <input 
                            type="text" 
                            className="w-full bg-transparent text-base text-slate-800 border-b border-slate-200 focus:border-wmhi-blue focus:outline-none pb-1"
                            value={localJob.clientName}
                            onChange={(e) => handleUpdateField('clientName', e.target.value)}
                        />
                    </div>

                    {/* Row 3 */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Contact Number</div>
                    <div className="md:col-span-2 flex items-center gap-2">
                        <input 
                            type="text" 
                            className="w-full bg-transparent text-base text-slate-800 border-b border-slate-200 focus:border-wmhi-blue focus:outline-none pb-1"
                            value={localJob.clientPhone || ''}
                            onChange={(e) => handleUpdateField('clientPhone', e.target.value)}
                            placeholder="Add number..."
                        />
                        {localJob.clientPhone && (
                            <a href={`tel:${localJob.clientPhone}`} className="p-2 bg-blue-50 text-wmhi-blue rounded-full hover:bg-blue-100"><Phone size={16}/></a>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="md:col-span-3 border-t border-slate-100 my-2"></div>

                    {/* Team Section */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Team Assignments</div>
                    <div className="md:col-span-2 space-y-3">
                         <input 
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-wmhi-blue focus:outline-none"
                            value={localJob.projectManager || ''}
                            onChange={(e) => handleUpdateField('projectManager', e.target.value)}
                            placeholder="Project Manager"
                        />
                         <input 
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-wmhi-blue focus:outline-none"
                            value={localJob.builder || ''}
                            onChange={(e) => handleUpdateField('builder', e.target.value)}
                            placeholder="Builder"
                        />
                        <div className="flex gap-2">
                            <input 
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-wmhi-blue focus:outline-none"
                                value={localJob.electrician || ''}
                                onChange={(e) => handleUpdateField('electrician', e.target.value)}
                                placeholder="Electrician"
                            />
                            <input 
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-wmhi-blue focus:outline-none"
                                value={localJob.plumber || ''}
                                onChange={(e) => handleUpdateField('plumber', e.target.value)}
                                placeholder="Plumber"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="md:col-span-3 border-t border-slate-100 my-2"></div>
                    
                    {/* Docs Section */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Documentation</div>
                    <div className="md:col-span-2 space-y-4">
                        {/* Plans */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-400">ARCHITECT PLANS</label>
                                <button onClick={() => plansInputRef.current?.click()} className="text-wmhi-blue text-xs font-bold hover:underline">+ Upload</button>
                            </div>
                            <div className="space-y-2">
                                {localJob.architectPlans?.map((plan, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-sm group">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-slate-400"/>
                                            <span className="text-slate-700 truncate">{plan}</span>
                                        </div>
                                        <button onClick={() => removeDocument('architectPlans', index)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                <input type="file" hidden ref={plansInputRef} onChange={handleDocumentUpload('architectPlans')} />
                            </div>
                        </div>
                         {/* Calcs */}
                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-400">STRUCTURAL CALCS</label>
                                <button onClick={() => calcsInputRef.current?.click()} className="text-wmhi-blue text-xs font-bold hover:underline">+ Upload</button>
                            </div>
                            <div className="space-y-2">
                                {localJob.structuralCalculations?.map((calc, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-sm group">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-slate-400"/>
                                            <span className="text-slate-700 truncate">{calc}</span>
                                        </div>
                                        <button onClick={() => removeDocument('structuralCalculations', index)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                <input type="file" hidden ref={calcsInputRef} onChange={handleDocumentUpload('structuralCalculations')} />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="md:col-span-3 border-t border-slate-100 my-2"></div>

                    {/* Dates */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Schedule</div>
                    <div className="md:col-span-2 flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                            <input type="date" className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-1.5 text-sm" value={localJob.startDate || ''} onChange={(e) => handleUpdateField('startDate', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Finish Date</label>
                            <input type="date" className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-1.5 text-sm" value={localJob.finishDate || ''} onChange={(e) => handleUpdateField('finishDate', e.target.value)} />
                        </div>
                    </div>

                    {/* Stages */}
                    <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Current Stage</div>
                    <div className="md:col-span-2">
                        <select 
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-wmhi-blue focus:outline-none"
                            value={localJob.currentStage}
                            onChange={(e) => handleUpdateField('currentStage', e.target.value)}
                        >
                            {JOB_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                        </select>
                    </div>

                     {/* Photos */}
                     <div className="text-left md:text-right font-bold text-slate-500 pt-2 text-sm uppercase">Gallery</div>
                     <div className="md:col-span-2">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {localJob.galleryImages.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative group">
                                    <img src={img} alt="Job" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <button className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-wmhi-blue hover:border-wmhi-blue hover:bg-blue-50 transition-all">
                                <ImageIcon size={20} />
                                <span className="text-[10px] mt-1 font-bold">ADD</span>
                            </button>
                        </div>
                     </div>

                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Activity Stream & Site Diary */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.05)] z-10">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-wmhi-blue text-wmhi-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Project Chat
                </button>
                <button 
                    onClick={() => setActiveTab('diary')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'diary' ? 'border-wmhi-blue text-wmhi-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Site Diary
                </button>
            </div>

            {/* TAB CONTENT: CHAT */}
            {activeTab === 'chat' && (
                <>
                    {/* CHAT SEARCH BAR & AI */}
                    <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wmhi-blue transition-all"
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                            />
                        </div>
                        {messages.length > 3 && (
                            <button 
                                onClick={triggerAiSummary}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                            >
                                <Sparkles size={14}/> Summarize Chat with AI
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {filteredMessages.length === 0 ? (
                             <div className="text-center py-10 opacity-50">
                                <MessageSquare size={48} className="mx-auto mb-2 text-slate-300"/>
                                <p className="text-sm text-slate-500">
                                    {chatSearch ? "No matching messages." : "No messages yet."}
                                </p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {msg.senderId === 'u1' ? 'O' : 'S'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-900">{msg.senderId === 'u1' ? 'WMHI OFFICE' : 'Site Team'}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg text-sm shadow-sm ${isMe ? 'bg-blue-50 border border-blue-100 text-slate-800' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="relative">
                            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
                            <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Type a message..."
                            className="w-full bg-white text-slate-800 p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-wmhi-blue focus:border-transparent text-sm resize-none"
                            rows={2}
                            />
                            <div className="absolute right-2 bottom-2 flex gap-1">
                                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-wmhi-blue rounded-full">
                                    <Paperclip size={16}/>
                                </button>
                                <button onClick={handleSendMessage} disabled={!messageText.trim()} className="p-1.5 bg-wmhi-blue text-white rounded-md hover:bg-blue-800 disabled:opacity-50">
                                    <Send size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* TAB CONTENT: SITE DIARY */}
            {activeTab === 'diary' && (
                <>
                    {/* SEARCH BAR */}
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search diary entries..." 
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wmhi-blue transition-all"
                                value={diarySearch}
                                onChange={(e) => setDiarySearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <StickyNote size={48} className="mx-auto mb-2 text-slate-300"/>
                                <p className="text-sm text-slate-500">
                                    {diarySearch ? "No matching entries found." : "No diary entries yet."}
                                </p>
                            </div>
                        ) : (
                            filteredNotes.map((note) => {
                                const user = getUserDetails(note.userId);
                                return (
                                    <div key={note.id} className="relative pl-6 border-l-2 border-slate-200 pb-2 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-wmhi-blue"></div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">{user.name}</span>
                                                <span className="text-xs text-slate-400">{new Date(note.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 shadow-sm whitespace-pre-line">
                                            {note.content}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={notesEndRef} />
                    </div>

                     <div className="p-4 bg-white border-t border-slate-200">
                        <div className="mb-2 text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Clock size={12}/> Log New Entry
                        </div>
                        <div className="relative">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Enter site observation, progress note, or issue..."
                                className="w-full bg-white text-slate-800 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-wmhi-blue focus:border-transparent text-sm resize-none mb-2"
                                rows={3}
                            />
                            <button 
                                onClick={handleAddNote} 
                                disabled={!noteText.trim()} 
                                className="w-full py-2 bg-wmhi-blue text-white rounded-md hover:bg-blue-800 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <StickyNote size={14}/> Add to Diary
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>

      </div>
    </div>
  );
};

export default JobDetail;
