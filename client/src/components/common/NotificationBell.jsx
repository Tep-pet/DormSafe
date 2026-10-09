import { useEffect, useState, useRef } from 'react';
import { Bell, RotateCw, Inbox, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';

export function NotificationBell() {
  const { accessToken, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  async function load() {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [countRes, listRes] = await Promise.all([
        notificationService.unreadCount(accessToken),
        notificationService.list(accessToken),
      ]);
      const rawList = listRes.data || [];
      const filtered = rawList.filter(
        (n) => n.metadata?.kind !== 'room_request' && n.title !== 'Room request sent'
      );
      setCount(countRes.data?.count || 0);
      setItems(filtered);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) load();
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleRead(id) {
    await notificationService.markRead(id, accessToken);
    load();
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Unified Trigger Button: clicking bell icon OR number of notifications pops out */}
      <button
        type="button"
        id="notification-bell-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${count} unread)`}
        aria-expanded={isOpen}
        className={`relative flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-blue-50 text-ateneo-blue ring-2 ring-ateneo-blue/20'
            : 'text-slate-600 hover:text-ateneo-blue hover:bg-slate-100'
        }`}
      >
        <Bell size={18} strokeWidth={2} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white cursor-pointer transition-transform hover:scale-110"
            title={`${count} unread notifications`}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Popout notifications panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 sm:w-88 z-50 rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              {count > 0 && (
                <span className="rounded-full bg-blue-100 text-ateneo-blue px-2 py-0.5 text-[11px] font-bold">
                  {count} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={load}
              className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
              title="Refresh"
            >
              <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Scrollable list */}
          <div className="max-h-80 w-full overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <Inbox size={26} className="text-slate-300 mb-1.5" strokeWidth={1.5} />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-left transition ${
                    n.read_at ? 'bg-white' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{n.body}</p>
                  )}
                  {!n.read_at && (
                    <button
                      type="button"
                      onClick={() => handleRead(n.id)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-ateneo-blue hover:underline"
                    >
                      <Check size={11} strokeWidth={2.5} />
                      <span>Mark as read</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
