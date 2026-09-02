import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { useLayoutStore } from '../../store/layout';
import { Button } from './Button';

export function CalendarWidget() {
  const { token } = useAuthStore();
  const { isSidebarCollapsed, activeCalendarDate, setActiveCalendarDate, toggleSidebar } = useLayoutStore();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // State
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [isAdding, setIsAdding] = useState(false);
  const [addDate, setAddDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [addTime, setAddTime] = useState('09:00');
  const [addTitle, setAddTitle] = useState('');

  // Sync current month if active date changes externally (e.g. from notification)
  useEffect(() => {
    if (activeCalendarDate) {
      setCurrentMonth(dayjs(activeCalendarDate).startOf('month'));
    }
  }, [activeCalendarDate]);

  // Fetch reminders for the current view month (and adjacent days)
  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', currentMonth.format('YYYY-MM')],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/reminders`, {
        params: { month: currentMonth.format('YYYY-MM') },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    refetchInterval: 60000 // refresh every minute to stay in sync with notifications
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string, scheduledFor: string }) => {
      await axios.post(`${API_URL}/reminders`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // trigger bell update
      setIsAdding(false);
      setAddTitle('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      await axios.patch(`${API_URL}/reminders/${id}`, { completed }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/reminders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Calendar logic
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.day(); // 0 (Sun) to 6 (Sat)
  
  const calendarGrid = useMemo(() => {
    const grid = [];
    let day = 1;
    // We only need 5-6 rows. Let's just generate 42 cells (6 rows * 7 days)
    for (let i = 0; i < 42; i++) {
      if (i < firstDayOfMonth || day > daysInMonth) {
        grid.push(null);
      } else {
        grid.push(currentMonth.date(day).format('YYYY-MM-DD'));
        day++;
      }
    }
    // Trim empty last row if exists
    if (grid.slice(35).every(d => d === null)) {
      return grid.slice(0, 35);
    }
    return grid;
  }, [currentMonth, daysInMonth, firstDayOfMonth]);

  const hasReminders = (dateStr: string) => {
    return reminders.some((r: any) => !r.completed && r.scheduledFor.startsWith(dateStr));
  };

  const getRemindersForDate = (dateStr: string) => {
    return reminders.filter((r: any) => !r.completed && r.scheduledFor.startsWith(dateStr));
  };

  const openAddForm = (defaultDateStr?: string) => {
    setAddDate(defaultDateStr || dayjs().format('YYYY-MM-DD'));
    // Set default time to next hour
    const nextHour = dayjs().add(1, 'hour').startOf('hour');
    setAddTime(nextHour.format('HH:mm'));
    setAddTitle('');
    setIsAdding(true);
    setActiveCalendarDate(null);
  };

  const handleSaveReminder = () => {
    if (!addTitle.trim()) return;
    const scheduledFor = dayjs(`${addDate}T${addTime}`).toISOString();
    createMutation.mutate({ title: addTitle, scheduledFor });
  };

  // --- Collapsed State ---
  if (isSidebarCollapsed) {
    const activeRemindersCount = reminders.filter((r: any) => !r.completed && dayjs(r.scheduledFor).isBefore(dayjs().endOf('day'))).length;
    return (
      <div className="p-2 border-t border-ops-border-default flex justify-center shrink-0">
        <button 
          onClick={toggleSidebar}
          className="relative w-8 h-8 flex items-center justify-center text-ops-text-secondary hover:bg-ops-bg-base hover:text-ops-text-primary rounded-ops-sm transition-colors"
          title="Open Calendar"
        >
          <CalendarIcon size={16} />
          {activeRemindersCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-ops-bg-surface" />
          )}
        </button>
      </div>
    );
  }

  // --- Expanded State ---
  return (
    <div className="mx-4 mb-4 shrink-0 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm overflow-hidden flex flex-col max-h-[300px] scale-[0.95] origin-bottom">
      
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-ops-border-default bg-ops-bg-base shrink-0">
        <button 
          onClick={() => {
            if (activeCalendarDate) setActiveCalendarDate(null);
            else setIsAdding(false);
            setCurrentMonth(currentMonth.subtract(1, 'month'));
          }}
          className="p-1 text-ops-text-muted hover:text-ops-text-primary rounded"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-ops-xs font-semibold text-ops-text-primary">
          {currentMonth.format('MMMM YYYY')}
        </span>
        <button 
          onClick={() => {
            if (activeCalendarDate) setActiveCalendarDate(null);
            else setIsAdding(false);
            setCurrentMonth(currentMonth.add(1, 'month'));
          }}
          className="p-1 text-ops-text-muted hover:text-ops-text-primary rounded"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {/* ADD REMINDER FORM */}
        {isAdding ? (
          <div className="p-3 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center mb-1">
              <span className="text-ops-xs font-semibold text-ops-text-primary">New Reminder</span>
              <button onClick={() => setIsAdding(false)} className="text-ops-text-muted hover:text-ops-text-primary"><X size={14} /></button>
            </div>
            <input 
              type="date" 
              value={addDate} 
              onChange={e => setAddDate(e.target.value)}
              className="w-full text-ops-xs p-1.5 border border-ops-border-strong rounded focus:outline-none focus:border-ops-primary"
            />
            <input 
              type="time" 
              value={addTime} 
              onChange={e => setAddTime(e.target.value)}
              className="w-full text-ops-xs p-1.5 border border-ops-border-strong rounded focus:outline-none focus:border-ops-primary"
            />
            <input 
              type="text" 
              placeholder="Reminder detail..." 
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              autoFocus
              className="w-full text-ops-xs p-1.5 border border-ops-border-strong rounded focus:outline-none focus:border-ops-primary"
            />
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="ghost" className="flex-1 h-7 text-[11px]" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" variant="primary" className="flex-1 h-7 text-[11px]" onClick={handleSaveReminder} isLoading={createMutation.isPending} disabled={!addTitle.trim()}>Save</Button>
            </div>
          </div>
        ) 
        
        // DAY DETAIL VIEW
        : activeCalendarDate ? (
          <div className="p-3 animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <span className="text-ops-xs font-semibold text-ops-text-primary">{dayjs(activeCalendarDate).format('MMM D, YYYY')}</span>
              <button onClick={() => setActiveCalendarDate(null)} className="text-ops-text-muted hover:text-ops-text-primary"><X size={14} /></button>
            </div>
            
            <div className="space-y-2 mb-3">
              {getRemindersForDate(activeCalendarDate).length === 0 ? (
                <p className="text-[11px] text-ops-text-muted text-center py-2">No reminders for this day.</p>
              ) : (
                getRemindersForDate(activeCalendarDate).map((r: any) => (
                  <div key={r.id} className="bg-ops-bg-base border border-ops-border-default rounded p-2 relative group">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-medium text-blue-500">{dayjs(r.scheduledFor).format('HH:mm')}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateMutation.mutate({ id: r.id, completed: true })} className="text-ops-text-muted hover:text-ops-primary" title="Mark Done"><CheckCircle size={12} /></button>
                        <button onClick={() => deleteMutation.mutate(r.id)} className="text-ops-text-muted hover:text-ops-danger" title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-[11px] text-ops-text-primary leading-tight mt-1">{r.title}</p>
                  </div>
                ))
              )}
            </div>

            <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] hover:!bg-ops-text-primary hover:!text-white transition-colors duration-200 ease-in-out" onClick={() => openAddForm(activeCalendarDate)}>
              <Plus size={12} className="mr-1" /> Add Reminder
            </Button>
          </div>
        ) 
        
        // MAIN CALENDAR GRID
        : (
          <div className="p-2 animate-fade-in">
            {/* Quick Chips */}
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1 no-scrollbar">
              {['Today', 'Tomorrow', 'In 2 days'].map((label, idx) => {
                const date = dayjs().add(idx, 'day');
                return (
                  <button 
                    key={label}
                    onClick={() => openAddForm(date.format('YYYY-MM-DD'))}
                    className="shrink-0 text-[10px] px-2 py-0.5 bg-ops-bg-base border border-ops-border-default rounded-full text-ops-text-secondary hover:text-ops-text-primary hover:border-ops-border-strong whitespace-nowrap transition-colors"
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] font-medium text-ops-text-muted">{d}</div>
              ))}
            </div>

            {/* Grid Cells */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentMonth.format('YYYY-MM')}
                initial={!shouldReduceMotion ? { opacity: 0, x: -10 } : { opacity: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={!shouldReduceMotion ? { opacity: 0, x: 10 } : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-0.5"
              >
                {calendarGrid.map((dateStr, i) => {
                  if (!dateStr) return <div key={i} className="aspect-square" />;
                  const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                  const hasDot = hasReminders(dateStr);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveCalendarDate(dateStr)}
                      className={`aspect-square flex flex-col items-center justify-center relative hover:bg-ops-bg-base transition-colors ${
                        isToday ? 'bg-orange-500 text-white font-semibold rounded-full animate-pulse-slow' : 'text-ops-text-secondary text-xs rounded'
                      }`}
                    >
                      <span className="text-[11px] leading-none z-10">{dayjs(dateStr).format('D')}</span>
                      {hasDot && (
                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-500'}`} />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full h-7 text-[11px] mt-2 text-ops-text-secondary hover:!bg-ops-text-primary hover:!text-white transition-colors duration-200 ease-in-out" 
              onClick={() => openAddForm()}
            >
              <Plus size={12} className="mr-1" /> Add Reminder
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
