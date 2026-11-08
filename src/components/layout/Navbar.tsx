import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Video,
  Film,
  Library,
  HelpCircle,
  Settings as SettingsIcon,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isGuest, isConfigured, signOut } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Studio', path: '/', icon: Video },
    { name: 'Saved Videos', path: '/videos', icon: Library },
    { name: 'Editor', path: '/editor', icon: Film },
    { name: 'How It Works', path: '/how-it-works', icon: HelpCircle },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-surface-card border border-brand/40 flex items-center justify-center group-hover:border-brand shadow-brand-glow transition-all">
              <div className="w-4 h-4 rounded-full bg-brand animate-pulse-slow" />
              <div className="absolute inset-0 rounded-xl border border-brand/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                CAPTURE <span className="text-brand">STUDIO</span>
              </span>
              <span className="text-[10px] text-text-muted font-medium tracking-wider uppercase -mt-1">
                Record • Edit • Create
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-brand bg-brand/10 border border-brand/20 font-semibold'
                        : 'text-text-secondary hover:text-white hover:bg-surface-elevated'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User / Guest Status & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-border text-xs text-text-primary">
                  <div className="w-2 h-2 rounded-full bg-brand" />
                  <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
                  <Badge variant="brand" size="sm">
                    <Cloud className="w-3 h-3" /> Synced
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Badge variant="secondary" size="md">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                  Guest Mode
                </Badge>
                {isConfigured ? (
                  <Link to="/auth/login">
                    <Button variant="secondary" size="sm" icon={<User className="w-4 h-4" />}>
                      Sign In
                    </Button>
                  </Link>
                ) : (
                  <Link to="/settings">
                    <span className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
                      Offline Mode Active
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-surface-card border border-border text-text-secondary hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface-secondary px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'text-brand bg-brand/10 border border-brand/20'
                      : 'text-text-secondary hover:text-white hover:bg-surface-elevated'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}

          <div className="pt-4 border-t border-border flex flex-col gap-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-primary">
                  {user.displayName || user.email}
                </div>
                <Button variant="danger" size="sm" onClick={handleSignOut} icon={<LogOut className="w-4 h-4" />}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" size="md">Guest Mode Active</Badge>
                {isConfigured && (
                  <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm">Sign In</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
