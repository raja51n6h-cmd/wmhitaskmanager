
import React from 'react';
import { LayoutDashboard, Hammer, MessageSquare, Users, Settings, LogOut, CheckSquare } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onSignOut }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.JOBS, label: 'Projects', icon: Hammer },
    { id: View.MESSAGES, label: 'Comms', icon: MessageSquare },
    { id: View.TASKS, label: 'Tasks', icon: CheckSquare },
    { id: View.TEAM, label: 'Team', icon: Users },
    { id: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-wmhi-blue text-white flex flex-col h-screen fixed left-0 top-0 border-r border-blue-900 z-10 hidden md:flex">
      <div className="p-8 border-b border-blue-800 flex flex-col items-center text-center justify-center min-h-[120px]">
        <h1 className="text-2xl font-black tracking-wider text-white leading-none mb-1">WEST MIDLANDS</h1>
        <p className="text-[11px] font-bold tracking-[0.2em] text-red-500 uppercase">Home Improvements</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-wmhi-red text-white font-bold shadow-lg' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button 
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2 text-blue-300 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
