import React from 'react';
import { NavLink } from 'react-router-dom';
import { Video, Library, Film, Settings, HelpCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { name: 'Studio', path: '/', icon: Video },
    { name: 'Videos', path: '/videos', icon: Library },
    { name: 'Editor', path: '/editor', icon: Film },
    { name: 'Guide', path: '/how-it-works', icon: HelpCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-secondary/95 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-brand font-semibold'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
