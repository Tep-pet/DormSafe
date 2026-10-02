import { useEffect, useState, useRef } from 'react';
import {
  Badge as HeroUIBadge,
  Button as HeroUIButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ScrollShadow,
  Chip,
} from '@heroui/react';
import { Bell, RotateCw, Inbox, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';

export function NotificationBell() {
  const { accessToken, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [countRes, listRes] = await Promise.all([
        notificationService.unreadCount(accessToken),
        notificationService.list(accessToken),
      ]);
      setCount(countRes.data?.count || 0);
      setItems(listRes.data || []);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) load();
  }, [accessToken, isAuthenticated]);

  async function handleRead(id) {
    await notificationService.markRead(id, accessToken);
    load();
  }

  if (!isAuthenticated) return null;

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      placement="bottom-end"
      offset={12}
      showArrow
    >
      <PopoverTrigger>
        <div className="relative inline-flex items-center">
          <HeroUIBadge
            content={count > 9 ? '9+' : count}
            color="danger"
            shape="circle"
            size="sm"
            isInvisible={count === 0}
          >
            <HeroUIButton
              isIconOnly
              variant="light"
              radius="full"
              aria-label="Notifications"
              className="text-gray-600 hover:text-ateneo-blue hover:bg-gray-100"
            >
              <Bell size={18} strokeWidth={2} />
            </HeroUIButton>
          </HeroUIBadge>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
        <div className="w-full bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
              {count > 0 && (
                <Chip size="sm" color="primary" variant="flat" className="text-xs font-semibold">
                  {count} new
                </Chip>
              )}
            </div>
            <button
              type="button"
              onClick={load}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              title="Refresh"
            >
              <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <ScrollShadow className="max-h-80 w-full overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                <Inbox size={24} className="text-gray-300 mb-1" strokeWidth={1.5} />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-left transition ${
                    n.read_at ? 'bg-white' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{n.body}</p>}
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
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  );
}
