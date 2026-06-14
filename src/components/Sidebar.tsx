import React from "react";
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  LogOut, 
  Moon, 
  Sun, 
  Settings, 
  Cloud, 
  CloudOff, 
  Database,
  Grid
} from "lucide-react";
import { ChatSession, UserProfile } from "@/src/types";

interface SidebarProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  profile: UserProfile;
  isGuest: boolean;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export default function Sidebar({
  sessions,
  activeChatId,
  profile,
  isGuest,
  isDarkMode,
  onThemeToggle,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  onSignOut,
}: SidebarProps) {

  const renderGradientAvatar = (iconName: string, colValue: string) => {
    return (
      <div className="relative shrink-0">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${colValue} flex items-center justify-center font-sans font-semibold text-xs text-white shadow-sm select-none`}>
          {iconName.substring(0, 2).toUpperCase()}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-550 border-2 border-white dark:border-slate-900 rounded-full" />
      </div>
    );
  };

  return (
    <div className="w-72 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full font-sans transition-all duration-300">
      
      {/* Top Header Panel */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-150 tracking-tight leading-tight">
              Lumina AI
            </h1>
            <span className="text-[10px] font-mono text-slate-400 capitalize flex items-center space-x-1 mt-0.5 select-none font-medium">
              {isGuest ? (
                <>
                  <Cloud size={9} className="text-emerald-500 shrink-0" />
                  <span>Sandbox Active</span>
                </>
              ) : (
                <>
                  <Cloud size={9} className="text-emerald-500 shrink-0" />
                  <span>Sync Active</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Global Action Handlers */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onThemeToggle}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/65 rounded-lg cursor-pointer transition shadow-sm"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      {/* Primary Conversation Initiator */}
      <div className="p-4 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-xl font-medium text-xs shadow-sm hover:shadow active:scale-[0.98] cursor-pointer transition duration-150"
        >
          <Plus size={14} />
          <span>New Dialogue</span>
        </button>
      </div>

      {/* List Active Chat Sessions (Firestore Synced) */}
      <div className="flex-1 overflow-y-auto px-3.5 space-y-1 py-1.5 scrollbar-thin">
        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 px-2.5 select-none">
          Recent History
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <MessageSquare size={20} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-semibold">No history found</p>
            <p className="text-[10px] px-4 mt-0.5 leading-normal">Start a dialogue to explore translation insights!</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = activeChatId === session.chatId;
            return (
              <div
                key={session.chatId}
                onClick={() => onSelectChat(session.chatId)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border duration-150 ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-l-indigo-500 font-semibold"
                    : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-250 font-medium"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <MessageSquare size={14} className={`shrink-0 ${isSelected ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-500"}`} />
                  <span className="text-xs truncate select-none leading-none">
                    {session.title || "Vocal Dialogue"}
                  </span>
                </div>
                
                <button
                  onClick={(e) => onDeleteChat(session.chatId, e)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 rounded transition duration-150 cursor-pointer shrink-0"
                  title="Remove consultation"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* User Avatar Profiles Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          {renderGradientAvatar(profile.avatarIcon, profile.avatarColor)}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {profile.displayName || "Alex Rivera"}
            </h4>
            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
              {profile.email}
            </p>
          </div>
        </div>

        {/* User Card Utility Buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg cursor-pointer transition hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Profile preferences settings"
          >
            <Settings size={13} />
          </button>
          <button
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer transition hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Sign out of system"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

    </div>
  );
}
