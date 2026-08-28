import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';

export function NotificationBell() {
  const { accessToken, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  async function load() {
    if (!accessToken) return;
    const [countRes, listRes] = await Promise.all([
      notificationService.unreadCount(accessToken),
      notificationService.list(accessToken),
    ]);
    setCount(countRes.data?.count || 0);
    setItems(listRes.data || []);
  }

  useEffect(() => {
    if (isAuthenticated) load();
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleRead(id) {
    await notificationService.markRead(id, accessToken);
    load();
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b px-4 py-2 text-sm font-medium">Notifications</div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`border-b px-4 py-3 text-sm ${n.read_at ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-gray-600">{n.body}</p>}
                  {!n.read_at && (
                    <button
                      type="button"
                      onClick={() => handleRead(n.id)}
                      className="mt-1 text-xs text-ateneo-blue hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
