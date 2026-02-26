import React from 'react';
import { Job, User } from '../types';
import { MessageSquare, ArrowRight, Clock, MapPin, User as UserIcon } from 'lucide-react';

interface UnifiedInboxProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  currentUser: User;
  allUsers: User[];
}

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ jobs, onSelectJob, currentUser, allUsers }) => {
  
  // 1. Filter jobs based on assignment (Admin sees all)
  const visibleJobs = currentUser.role === 'Admin' 
    ? jobs 
    : jobs.filter(job => job.assignedTeam.includes(currentUser.id));

  // 2. Flatten messages
  const allMessages = visibleJobs.flatMap(job => 
    job.messages.map(msg => ({
      ...msg,
      jobContext: job
    }))
  );

  // 3. Sort by timestamp (newest first)
  allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getUser = (id: string) => allUsers.find(u => u.id === id) || { name: 'Unknown', avatar: '', role: 'Unknown' };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-full">
      <div className="mb-6 flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-wmhi-blue">Comms Feed</h2>
            <p className="text-slate-500">Live feed of messages from your assigned projects.</p>
         </div>
         <div className="bg-blue-50 text-wmhi-blue px-3 py-1 rounded-full text-xs font-bold">
            {allMessages.length} Messages
         </div>
      </div>

      <div className="space-y-4">
        {allMessages.length > 0 ? (
            allMessages.map(msg => {
                const sender = getUser(msg.senderId);
                const isMe = msg.senderId === currentUser.id;

                return (
                    <div 
                        key={`${msg.jobContext.id}-${msg.id}`} 
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                    >
                        {/* Header: Context */}
                        <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectJob(msg.jobContext)}>
                                <div className="bg-red-50 p-1.5 rounded-md text-wmhi-red">
                                    <MapPin size={14} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 hover:text-wmhi-blue transition-colors">
                                        {msg.jobContext.address}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{msg.jobContext.clientName}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                <Clock size={12} />
                                {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </span>
                        </div>

                        {/* Body: Message */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                {sender.avatar ? (
                                    <img src={sender.avatar} alt={sender.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-100" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        <UserIcon size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-slate-900 text-sm">{sender.name}</span>
                                    <span className="text-xs text-slate-400">({sender.role})</span>
                                </div>
                                <div className={`text-sm leading-relaxed p-3 rounded-br-lg rounded-bl-lg rounded-tr-lg border ${
                                    msg.type === 'system' 
                                        ? 'bg-slate-50 text-slate-500 italic border-slate-100' 
                                        : 'bg-white text-slate-700 border-slate-100'
                                }`}>
                                    {msg.text}
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button 
                                        onClick={() => onSelectJob(msg.jobContext)}
                                        className="text-xs font-bold text-wmhi-blue hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Reply in Context <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p>No messages found in your assigned projects.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedInbox;