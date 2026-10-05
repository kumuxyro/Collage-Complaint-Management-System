import React, { useRef, useState, useEffect } from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { Bell, Check, X, Clock, ExternalLink } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: 'ticket' | 'sla' | 'system';
  isUnread: boolean;
}

export function NotificationPopover() {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Neutral operational alerts without fake personal names
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Department Queue Dispatch',
      message: 'New grievance ticket routed to appropriate facilities custodian.',
      timeAgo: '12m ago',
      type: 'ticket',
      isUnread: true,
    },
    {
      id: 'notif-2',
      title: 'SLA Escalation Monitoring',
      message: 'Active complaint SLA tracking is running with Jira synchronization.',
      timeAgo: '45m ago',
      type: 'sla',
      isUnread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-white/[0.09] bg-[#0A0A0E] hover:bg-[#121217] hover:border-red-500/40 text-zinc-300 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        title="Notifications"
        aria-label="Toggle notifications menu"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#E50914] text-[10px] font-bold text-white shadow-[0_0_10px_rgba(229,9,20,0.85)] font-mono animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Cinematic Dropdown Drawer / Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/[0.12] bg-[#07070A]/98 backdrop-blur-2xl shadow-[0_24px_60px_-10px_rgba(0,0,0,0.95)] z-50 p-4 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-display">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono text-red-400 bg-red-950/40 border border-red-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markSingleAsRead(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                  item.isUnread
                    ? 'bg-[#101015] border-white/[0.12] hover:border-red-500/40'
                    : 'bg-[#0A0A0D]/70 border-white/[0.05] hover:bg-[#0D0D12]'
                }`}
              >
                {item.isUnread && (
                  <span className="absolute left-1.5 top-3.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(229,9,20,0.9)]" />
                )}

                <div className={`space-y-1 ${item.isUnread ? 'pl-2' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {item.timeAgo}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Role Context: {role.toUpperCase()}</span>
            <span className="text-red-400">Jira Realtime Sync</span>
          </div>
        </div>
      )}
    </div>
  );
}
