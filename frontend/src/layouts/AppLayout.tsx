import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/auth/useAuth';
import { useCurrentProfile } from '@/hooks/useProfile';
import {
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
  User,
  LayoutDashboard,
  Settings,
  BookOpen,
  Compass,
  Inbox,
  Calendar,
  Clock,
  Coins,
  MessageSquare,
  Pin,
  PinOff,
  ChevronRight,
  Shield,
  Bell,
} from 'lucide-react';
import { useUnreadChatCount } from '@/hooks/useChat';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';

export const AppLayout: React.FC = () => {
  const { theme, toggleTheme, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const { isAuthenticated, user, logout } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: unreadData } = useUnreadChatCount();
  const { data: notifUnreadData } = useUnreadNotificationCount();
  const location = useLocation();
  const navigate = useNavigate();

  // Hover & Pin State for Desktop Sidebar
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Student';
  const unreadCount = unreadData?.count || 0;
  const notifUnreadCount = notifUnreadData?.count || 0;

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Requests', path: '/requests', icon: Inbox },
    { label: 'Sessions', path: '/sessions', icon: Calendar },
    { label: 'Availability', path: '/availability', icon: Clock },
    {
      label: 'Messages',
      path: '/messages',
      icon: MessageSquare,
      badge: unreadCount,
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: notifUnreadCount,
    },
    { label: 'Wallet', path: '/wallet', icon: Coins },
    { label: 'Skills Profile', path: '/profile/skills', icon: BookOpen },
    { label: 'Moderation', path: '/moderation', icon: Shield },
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isNavActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app';
    if (path === '/profile') return location.pathname === '/profile';
    return location.pathname.startsWith(path);
  };

  const isSidebarVisible = isSidebarHovered || isSidebarPinned;

  return (
    <div className="min-h-screen flex bg-[#0B1220] text-[#CBD5E1] antialiased selection:bg-[#10B981]/25 selection:text-[#F8F5ED] relative">
      {/* Background ambient lighting - Extremely subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 right-10 w-[600px] h-[350px] bg-emerald-500/[0.04] blur-[140px] rounded-full" />
        <div className="absolute top-20 -left-20 w-[500px] h-[300px] bg-[#D4AF6A]/[0.03] blur-[130px] rounded-full" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[300px] bg-slate-800/[0.15] blur-[140px] rounded-full" />
      </div>

      {/* ========================================================================= */}
      {/* LEFT-SIDE HOVER TRIGGER STRIP (Desktop) */}
      {/* ========================================================================= */}
      {isAuthenticated && !isSidebarPinned && (
        <div
          className="hidden lg:flex fixed left-0 top-0 bottom-0 w-5 z-40 items-center justify-start group cursor-pointer"
          onMouseEnter={() => setIsSidebarHovered(true)}
          title="Move mouse here to open menu"
        >
          {/* Subtle Glowing Edge Indicator & Tab */}
          <div className="h-24 w-1 rounded-r-full bg-[#10B981]/30 group-hover:w-2.5 group-hover:bg-[#10B981] transition-all duration-200 shadow-sm flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-[#06131A] opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
          </div>
        </div>
      )}

      {/* Optional Subtle Backdrop when Hovered & Unpinned */}
      {isAuthenticated && isSidebarHovered && !isSidebarPinned && (
        <div
          className="hidden lg:block fixed inset-0 bg-[#0B1220]/60 backdrop-blur-[2px] z-40 transition-opacity duration-200"
          onClick={() => setIsSidebarHovered(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* AUTO-TOGGLE VERTICAL SIDEBAR (Desktop) */}
      {/* ========================================================================= */}
      {isAuthenticated && (
        <aside
          className={`hidden lg:flex flex-col w-64 border-r border-[rgba(212,175,106,0.18)] bg-[#111827] fixed left-0 top-0 h-screen z-50 shrink-0 select-none shadow-2xl shadow-black/80 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSidebarVisible ? 'translate-x-0' : '-translate-x-full'
          }`}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          {/* Logo & Brand Header with Pin Toggle */}
          <div className="p-5 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <Link
                to="/app"
                className="flex items-center gap-2.5 group"
                onClick={() => !isSidebarPinned && setIsSidebarHovered(false)}
              >
                <div className="w-9 h-9 rounded-xl bg-[#1E293B] border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shadow-sm group-hover:border-[#10B981] transition-colors shrink-0">
                  <Sparkles className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight text-[#F8F5ED] leading-tight font-display">
                    SkillSwap
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-medium">
                    Collegiate Skill Exchange
                  </span>
                </div>
              </Link>

              {/* Pin / Unpin Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                className={`w-7 h-7 ${
                  isSidebarPinned
                    ? 'text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30'
                    : 'text-[#94A3B8] hover:text-[#F8F5ED]'
                }`}
                title={isSidebarPinned ? 'Unpin Sidebar (Auto-hide on leave)' : 'Pin Sidebar (Keep always open)'}
              >
                {isSidebarPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </Button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/12 text-[#34D399] border border-[#10B981]/25">
                Verified Student Network
              </span>
              <span className="text-[10px] text-[#64748B]">
                {isSidebarPinned ? 'Pinned' : 'Auto-hide'}
              </span>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = isNavActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => !isSidebarPinned && setIsSidebarHovered(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[#10B981]/12 text-[#10B981] font-semibold border border-[#10B981]/30'
                      : 'text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#10B981] text-[#06131A] shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer / User & Utility Links */}
          <div className="p-3 border-t border-slate-800 space-y-2 bg-[#0E1522]">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] bg-[#1E293B]/40 border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>SkillSwap Secure</span>
              </div>
              <span className="text-[10px] text-[#64748B]">v1.0.0</span>
            </div>

            {/* Profile Bar */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B] border border-slate-700/60">
              <Link
                to="/profile"
                onClick={() => !isSidebarPinned && setIsSidebarHovered(false)}
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
              >
                <div className="w-7 h-7 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-xs font-bold shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#F8F5ED] truncate group-hover:text-[#10B981] transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] truncate">{user?.email}</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-7 h-7 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 shrink-0 ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isAuthenticated && isSidebarPinned ? 'lg:pl-64' : 'pl-0'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full border-b border-[rgba(212,175,106,0.22)] bg-[rgba(11,18,32,0.92)] backdrop-blur-md">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left Header items */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Mobile toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden w-9 h-9 text-[#F8F5ED]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>

                  {/* Desktop Manual Trigger Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 text-xs text-[#CBD5E1] hover:text-[#F8F5ED] h-8 px-2.5 border border-slate-700/60 bg-[#1E293B]/60"
                    onClick={() => setIsSidebarHovered(!isSidebarHovered)}
                  >
                    <Menu className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Menu</span>
                  </Button>

                  {/* Brand Header */}
                  <div className="flex items-center gap-2">
                    <Link to="/app" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#1E293B] border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shadow-sm">
                        <Sparkles className="w-4 h-4 text-[#10B981]" />
                      </div>
                      <span className="font-extrabold text-lg tracking-tight text-[#F8F5ED] font-display">
                        SkillSwap
                      </span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-[#1E293B] border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <Sparkles className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-[#F8F5ED] font-display">
                      SkillSwap
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Header items (Theme toggle, auth buttons) */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-9 h-9 text-[#94A3B8] hover:text-[#F8F5ED]"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {!isAuthenticated && (
                <>
                  <Link to="/discover" className="hidden sm:inline-flex">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
                      Explore Skills
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-[#CBD5E1]">
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="default" size="sm" className="h-8 text-xs gap-1.5 font-semibold">
                      <UserPlus className="w-3.5 h-3.5" />
                      Get Started
                    </Button>
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#1E293B] border border-slate-700/60 text-xs font-medium hover:border-[#10B981]/40 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-[10px] font-bold overflow-hidden">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-[#F8F5ED] max-w-[110px] truncate hidden sm:inline">{displayName}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 text-xs text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 hidden sm:inline-flex"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && isAuthenticated && (
            <div className="lg:hidden border-b border-slate-800 bg-[#111827] px-4 py-4 space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-xs font-bold overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#F8F5ED] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">{user?.email}</p>
                </div>
              </div>

              {navItems.map((item) => {
                const active = isNavActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-[#10B981]/12 text-[#10B981] font-semibold border border-[#10B981]/25'
                        : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8F5ED]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#10B981] text-[#06131A]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}


              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs gap-1.5 mt-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          )}
        </header>

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(212,175,106,0.20)] bg-[#0B1220] py-6 mt-auto text-xs text-[#94A3B8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#CBD5E1]">SkillSwap</span>
              <span>— Peer-to-Peer College Skill Exchange Platform</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-[#34D399]">100% Free Campus Learning & Mentorship</span>
              <span>•</span>
              <span>Student-Driven Ecosystem</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
