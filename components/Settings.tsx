
import React, { useState } from 'react';
import { User } from '../types';
import { Save, Bell, Lock, User as UserIcon, Mail, Check } from 'lucide-react';

interface SettingsProps {
  currentUser: User;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleChangePassword = () => {
      alert("A password reset link has been sent to your email address.");
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-wmhi-blue mb-2">Settings</h2>
      <p className="text-slate-500 mb-8">Manage your profile and notification preferences.</p>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon size={20} className="text-wmhi-red" />
                Profile Information
            </h3>
            <div className="flex items-center gap-4 mb-6">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full bg-slate-200" />
                <div>
                    <p className="font-bold text-lg">{currentUser.name}</p>
                    <p className="text-slate-500">{currentUser.role}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                    <input type="text" value={currentUser.name} disabled className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                    <input type="text" value={currentUser.role} disabled className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
            </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell size={20} className="text-wmhi-red" />
                Notifications
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-800">Email Notifications</p>
                        <p className="text-xs text-slate-500">Receive daily summaries and urgent alerts.</p>
                    </div>
                    <button 
                        onClick={() => setEmailNotifs(!emailNotifs)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${emailNotifs ? 'bg-wmhi-blue' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${emailNotifs ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>
            </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm opacity-75">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-wmhi-red" />
                Security
            </h3>
            <button onClick={handleChangePassword} className="text-wmhi-blue font-medium text-sm hover:underline">Change Password</button>
        </div>
        
        <div className="flex justify-end">
            <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-sm ${
                    isSaved ? 'bg-green-600 text-white' : 'bg-wmhi-blue text-white hover:bg-blue-800'
                }`}
            >
                {isSaved ? <Check size={18} /> : <Save size={18} />}
                {isSaved ? 'Saved!' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
