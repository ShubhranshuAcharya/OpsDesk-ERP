import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth';
import { useLayoutStore } from '../store/layout';

import { 
  Command, 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  FileSpreadsheet, 
  Shield, 
  BarChart2, 
  Search, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  AlertTriangle,
  Calendar,
  Check,
  X
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CalendarWidget } from './ui/CalendarWidget';
dayjs.extend(relativeTime);

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { label: 'Customers', path: '/customers', icon: <Users size={18} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { label: 'Products & Inventory', path: '/inventory', icon: <Package size={18} />, roles: ['ADMIN', 'WAREHOUSE'] },
  { label: 'Sales Challans', path: '/challans', icon: <FileText size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE'] },
  { label: 'Users & Roles', path: '/users', icon: <Shield size={18} />, roles: ['ADMIN'] },
  { label: 'Reports', path: '/reports', icon: <BarChart2 size={18} />, roles: ['ADMIN', 'ACCOUNTS'] },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // ─── Sidebar ─────────────────────────────────────────────────────────────────
  const { isSidebarCollapsed, toggleSidebar, openCalendarToDate } = useLayoutStore();

  // Mobile drawer (separate concept from desktop collapse)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

  // ─── Profile Menu ───────────────────────────────────────────────────────────
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Global Search ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['globalSearch', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return { customers: [], products: [] };
      const [customersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/customers?search=${encodeURIComponent(debouncedSearch)}&limit=5`, {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/products?search=${encodeURIComponent(debouncedSearch)}&limit=5`, {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
        }).catch(() => ({ data: { data: [] } })),
      ]);
      return {
        customers: customersRes.data.data || [],
        products: productsRes.data.data || [],
      };
    },
    enabled: debouncedSearch.length >= 2,
  });

  // ─── Notification Bell ──────────────────────────────────────────────────────
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Per-user read-state: store the count seen when the bell was last opened
  const notifSeenKey = `notif_seen_count_${user?.id}`;
  const [seenCount, setSeenCount] = useState<number>(() => {
    return parseInt(localStorage.getItem(notifSeenKey) || '0', 10);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      return res.data;
    },
    refetchInterval: 60_000, // poll every 60s
    staleTime: 30_000,
  });

  const allNotifications: any[] = notifData?.notifications || [];
  const stockAlerts = allNotifications.filter((n) => n.type === 'LOW_STOCK');
  const followUps = allNotifications.filter((n) => n.type === 'FOLLOW_UP');

  // Unread = total - what was seen when bell was last opened
  const unreadCount = Math.max(0, allNotifications.length - seenCount);
  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  const openNotifications = () => {
    setIsNotifOpen(true);
    setIsProfileOpen(false);
    // Mark all as "read" — store current total as seen
    const newSeen = allNotifications.length;
    setSeenCount(newSeen);
    localStorage.setItem(notifSeenKey, String(newSeen));
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    // Clear ALL TanStack Query cache — prevents stale role data leaking to next session
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const allowedNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role || ''));
  const { pageTitle } = useLayoutStore();
  const currentNavItem = NAV_ITEMS.find((item) => item.path === location.pathname)
    || NAV_ITEMS.find((item) => item.path !== '/' && location.pathname.startsWith(item.path))
    || { label: 'OpsDesk' };
  const displayTitle = pageTitle || currentNavItem.label;

  return (
    <div className="flex h-screen bg-ops-bg-base overflow-hidden font-sans text-ops-text-primary">
      
      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className={[
          'flex flex-col bg-ops-bg-surface border-r border-ops-border-default z-40 shrink-0',
          'transition-[width] duration-200 ease-in-out',
          // Desktop: controlled by collapse state
          isSidebarCollapsed ? 'lg:w-[64px]' : 'lg:w-[240px]',
          // Mobile: always 240px wide, slides in/out off-canvas
          'fixed inset-y-0 left-0 w-[240px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0 lg:inset-auto',
        ].join(' ')}>
        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-4 border-b border-ops-border-default shrink-0">
          <div className="w-8 h-8 rounded bg-ops-text-primary flex items-center justify-center text-white shrink-0">
            <Command size={18} />
          </div>
          {!isSidebarCollapsed && (
            <span className="ml-3 font-semibold tracking-tight text-ops-lg whitespace-nowrap overflow-hidden">
              OpsDesk
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="relative group/nav">
                <Link
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center h-9 px-2 rounded-ops-sm transition-colors duration-200 ease-in-out ${
                    isActive
                      ? 'bg-ops-text-primary text-white font-medium'
                      : 'text-ops-text-secondary hover:bg-ops-text-primary hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 transition-colors duration-200 ease-in-out ${
                    isActive ? 'text-white' : 'text-ops-text-muted group-hover/nav:text-white'
                  }`}>
                    {item.icon}
                  </div>

                  {/* Label — visually hidden (sr-only) when collapsed so screen readers keep it */}
                  <span className={`ml-3 text-ops-sm whitespace-nowrap overflow-hidden text-ellipsis ${
                    isSidebarCollapsed ? 'sr-only' : ''
                  }`}>
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip — only visible when sidebar is collapsed, on desktop hover */}
                {isSidebarCollapsed && (
                  <div
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2
                      opacity-0 group-hover/nav:opacity-100
                      transition-opacity delay-300 duration-150
                      bg-ops-bg-base border border-ops-border-default text-ops-sm text-ops-text-primary
                      px-2.5 py-1.5 rounded-ops-sm shadow-ops-sm whitespace-nowrap z-50
                      hidden lg:block"
                    role="tooltip"
                  >
                    {item.label}
                    {/* Arrow pointing left */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ops-border-default" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <CalendarWidget />

        {/* Collapse Toggle — desktop only */}
        <div className="p-3 border-t border-ops-border-default hidden lg:block">
          <button
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-full h-8 text-ops-text-muted hover:text-ops-text-primary hover:bg-ops-bg-base rounded-ops-sm transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-14 bg-ops-bg-surface border-b border-ops-border-default flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          
          <div className="flex items-center min-w-0 gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden w-9 h-9 flex items-center justify-center text-ops-text-secondary hover:text-ops-text-primary hover:bg-ops-bg-base rounded-ops-sm transition-colors shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
            <h1 className="text-ops-base font-semibold text-ops-text-primary truncate">
              {displayTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Global Search */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ops-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search customers, products..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setIsSearchOpen(true); }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-56 lg:w-64 h-9 pl-9 pr-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong focus:bg-ops-bg-surface transition-colors"
              />
              {isSearchOpen && searchTerm.length >= 2 && (
                <div className="absolute top-full mt-2 w-80 right-0 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-lg overflow-hidden z-50">
                  {isSearchLoading ? (
                    <div className="p-4 text-center text-ops-sm text-ops-text-muted">Searching...</div>
                  ) : (!searchResults?.customers.length && !searchResults?.products.length) ? (
                    <div className="p-4 text-center text-ops-sm text-ops-text-muted">No results found</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto py-2">
                      {searchResults.customers.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-1 text-ops-xs font-bold text-ops-text-muted uppercase tracking-wider bg-ops-bg-base">Customers</div>
                          {searchResults.customers.map((customer: any) => (
                            <button key={customer.id} onClick={() => { setIsSearchOpen(false); setSearchTerm(''); navigate(`/customers/${customer.id}`); }} className="w-full text-left px-4 py-2 hover:bg-ops-bg-base transition-colors">
                              <div className="text-ops-sm font-medium text-ops-text-primary">{customer.name}</div>
                              <div className="text-ops-xs text-ops-text-secondary">{customer.mobile || customer.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.products.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-ops-xs font-bold text-ops-text-muted uppercase tracking-wider bg-ops-bg-base">Products</div>
                          {searchResults.products.map((product: any) => (
                            <button key={product.id} onClick={() => { setIsSearchOpen(false); setSearchTerm(''); navigate(`/inventory/${product.id}`); }} className="w-full text-left px-4 py-2 hover:bg-ops-bg-base transition-colors">
                              <div className="text-ops-sm font-medium text-ops-text-primary">{product.name}</div>
                              <div className="text-ops-xs text-ops-text-secondary">SKU: {product.sku}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Notification Bell ─────────────────────────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                aria-label="Notifications"
                className="relative w-10 h-10 flex items-center justify-center text-ops-text-secondary hover:text-ops-text-primary hover:bg-ops-bg-base rounded-ops-sm transition-colors"
              >
                <Bell size={20} />
                {/* Badge */}
                {badgeLabel && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-ops-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badgeLabel}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-lg z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ops-border-default">
                    <span className="text-ops-sm font-semibold text-ops-text-primary">Notifications</span>
                    <button onClick={() => setIsNotifOpen(false)} className="text-ops-text-muted hover:text-ops-text-primary transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body */}
                  {allNotifications.length === 0 ? (
                    /* Empty state */
                    <div className="p-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <Check size={20} className="text-green-500" />
                      </div>
                      <p className="text-ops-sm font-medium text-ops-text-primary">You're all caught up</p>
                      <p className="text-ops-xs text-ops-text-muted mt-1">No stock alerts or pending follow-ups</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-ops-border-default">
                      {/* Stock Alerts section */}
                      {stockAlerts.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-ops-xs font-bold text-ops-text-muted uppercase tracking-wider bg-ops-bg-base sticky top-0">
                            Stock Alerts · {stockAlerts.length}
                          </div>
                          {stockAlerts.map((n: any) => (
                            <button
                              key={n.id}
                              onClick={() => { setIsNotifOpen(false); navigate(n.linkTo); }}
                              className="w-full text-left px-4 py-3 hover:bg-ops-bg-base transition-colors flex items-start gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle size={14} className="text-orange-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-ops-sm text-ops-text-primary font-medium leading-snug">{n.message}</p>
                                <p className="text-ops-xs text-ops-text-muted mt-0.5">{n.subMessage}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Follow-ups section */}
                      {followUps.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-ops-xs font-bold text-ops-text-muted uppercase tracking-wider bg-ops-bg-base sticky top-0">
                            Follow-ups · {followUps.length}
                          </div>
                          {followUps.map((n: any) => (
                            <button
                              key={n.id}
                              onClick={() => { setIsNotifOpen(false); navigate(n.linkTo); }}
                              className="w-full text-left px-4 py-3 hover:bg-ops-bg-base transition-colors flex items-start gap-3"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                n.subMessage === 'Overdue' ? 'bg-red-100' : 'bg-blue-50'
                              }`}>
                                <Calendar size={14} className={n.subMessage === 'Overdue' ? 'text-red-500' : 'text-blue-500'} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-ops-sm text-ops-text-primary font-medium leading-snug">{n.message}</p>
                                <p className={`text-ops-xs mt-0.5 font-medium ${n.subMessage === 'Overdue' ? 'text-ops-danger' : 'text-ops-text-muted'}`}>
                                  {n.subMessage}
                                  {n.timestamp && ` · ${dayjs(n.timestamp).fromNow()}`}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── User Profile Menu ─────────────────────────────────────────────── */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-2 hover:bg-ops-bg-base p-1 pr-2 rounded-ops-sm transition-colors border border-transparent hover:border-ops-border-default focus:outline-none"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-ops-primary text-white flex items-center justify-center text-ops-sm font-medium shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-ops-sm font-medium leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-ops-text-muted leading-tight uppercase tracking-wide">{user?.role}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm py-1 z-50">
                  {/* User header in dropdown */}
                  <div className="px-4 py-2.5 border-b border-ops-border-default">
                    <p className="text-ops-sm font-semibold text-ops-text-primary truncate">{user?.name}</p>
                    <p className="text-ops-xs text-ops-text-muted truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2 text-ops-sm text-ops-text-secondary hover:bg-ops-bg-base flex items-center gap-2 transition-colors"
                  >
                    <User size={15} /> Profile & Password
                  </button>



                  <div className="h-px bg-ops-border-default my-1"></div>

                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-ops-sm text-ops-danger hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
