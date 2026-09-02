import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend as RechartsLegend } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { motion, useReducedMotion, AnimatePresence, type Variants } from 'framer-motion';
import { AnimatedNumber } from '../components/ui/AnimatedNumber.tsx';
import { MultiArcProgress } from '../components/ui/MultiArcProgress.tsx';
import { BubbleCluster } from '../components/ui/BubbleCluster.tsx';
import { ArrowUpRight, ArrowDownRight, CheckCircle, Package, FileText, AlertTriangle, Clock, ChevronDown, Users } from 'lucide-react';

dayjs.extend(quarterOfYear);
dayjs.extend(relativeTime);

function getPresets() {
  const today = dayjs();
  return {
    'Today': [today.startOf('day'), today.endOf('day')],
    'This Week': [today.startOf('week'), today.endOf('week')],
    'This Month': [today.startOf('month'), today.endOf('month')],
    'This Quarter': [today.startOf('quarter'), today.endOf('quarter')]
  };
}

const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1B25] text-white px-3 py-2 rounded-lg shadow-xl text-xs pointer-events-none relative transform -translate-y-2">
        <p className="font-semibold mb-1 opacity-80">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-bold">{entry.value.toLocaleString()}</span>
            <span className="opacity-80">{entry.name}</span>
          </div>
        ))}
        {/* Tooltip Tail */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1B25] rotate-45" />
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { token } = useAuthStore();
  const shouldReduceMotion = useReducedMotion();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const presets = getPresets();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(presets['This Month'] as [dayjs.Dayjs, dayjs.Dayjs]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fromStr = dateRange[0].toISOString();
  const toStr = dateRange[1].toISOString();

  // Queries
  const { data: salesData, isLoading: salesLoading } = useQuery({ queryKey: ['report-sales', fromStr, toStr], queryFn: async () => (await axios.get(`${API_URL}/reports/sales-summary?from=${fromStr}&to=${toStr}`, { headers: { Authorization: `Bearer ${token}` } })).data });
  const { data: customerData, isLoading: customerLoading } = useQuery({ queryKey: ['report-customers', fromStr, toStr], queryFn: async () => (await axios.get(`${API_URL}/reports/customer-breakdown?from=${fromStr}&to=${toStr}`, { headers: { Authorization: `Bearer ${token}` } })).data });
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({ queryKey: ['report-inventory', fromStr, toStr], queryFn: async () => (await axios.get(`${API_URL}/reports/inventory-health?from=${fromStr}&to=${toStr}`, { headers: { Authorization: `Bearer ${token}` } })).data });
  const { data: followupData, isLoading: followupLoading } = useQuery({ queryKey: ['report-followups'], queryFn: async () => (await axios.get(`${API_URL}/reports/followup-compliance`, { headers: { Authorization: `Bearer ${token}` } })).data });

  const isLoading = salesLoading || customerLoading || inventoryLoading || followupLoading;
  
  // Custom Analytics Palette
  const PALETTE = {
    bg: '#F1F1F9',
    cardBg: '#FFFFFF',
    primary: '#4A55C7',
    secondary: '#F35B5B',
    successText: '#1FAA59',
    successBg: '#E6F9EE',
    dangerText: '#F35B5B',
    dangerBg: '#FDEAEA',
    textDark: '#1A1B25',
    textMuted: '#8A8FA3',
    chartGray: '#E4E7EC'
  };

  const CUSTOMER_COLORS = [PALETTE.primary, '#636EE0', '#8A94F5']; // Shades of indigo

  const SkeletonBlock = ({ className, style }: { className: string, style?: React.CSSProperties }) => <div className={`animate-pulse bg-[#E4E7EC] rounded-lg ${className}`} style={style} />;

  // Calculated values
  const totalChallans = useMemo(() => salesData?.statusCounts?.reduce((sum: number, s: any) => sum + s.count, 0) || 0, [salesData]);
  const overdueCount = followupData?.overdueCount || 0;
  
  // Progress Ring logic
  const totalCustomers = customerData?.totalCount || 1;
  const activeCustomers = customerData?.statusCounts?.find((c: any) => c.name === 'ACTIVE')?.value || 0;
  const leadCustomers = customerData?.statusCounts?.find((c: any) => c.name === 'LEAD')?.value || 0;
  
  const activePct = Math.round((activeCustomers / totalCustomers) * 100);
  const leadPct = Math.round((leadCustomers / totalCustomers) * 100);

  // Bubble logic
  const bubbleData = useMemo(() => {
    if (!customerData?.typeCounts) return [];
    return customerData.typeCounts.map((c: any) => ({
      id: c.name,
      label: c.name,
      value: c.value
    }));
  }, [customerData]);

  const DateDropdown = ({ id, label }: { id: string, label: string }) => (
    <div className="relative">
      <button onClick={() => setActiveDropdown(activeDropdown === id ? null : id)} className="flex items-center gap-1 text-[11px] font-semibold text-[#8A8FA3] hover:text-[#1A1B25] transition-colors bg-[#F1F1F9] px-2.5 py-1.5 rounded-md">
        {label} <ChevronDown size={14} />
      </button>
      {activeDropdown === id && (
        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#E4E7EC] py-1 z-20">
          {Object.entries(presets).map(([k, range]) => (
            <button key={k} onClick={() => { setDateRange([range[0], range[1]] as [dayjs.Dayjs, dayjs.Dayjs]); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs text-[#1A1B25] hover:bg-[#F1F1F9]">
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen -m-4 p-4 sm:p-6 pb-12 transition-colors" style={{ backgroundColor: PALETTE.bg }}>
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: PALETTE.textDark }}>Reports</h2>
        <p className="text-sm mt-0.5" style={{ color: PALETTE.textMuted }}>Aggregated business data and analytics.</p>
      </div>

      <motion.div variants={!shouldReduceMotion ? listContainer : undefined} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* TOP-LEFT: 2x2 KPI Grid */}
          <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* 1. Hero Card */}
            <motion.div whileHover={!shouldReduceMotion ? { y: -2 } : {}} className="relative overflow-hidden rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[160px] transition-transform" style={{ backgroundColor: PALETTE.primary }}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                  <Package size={22} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: PALETTE.successBg, color: PALETTE.successText }}>
                  <ArrowUpRight size={14} strokeWidth={3} />
                  <span>+12%</span>
                </div>
              </div>
              <div>
                <div className="text-[40px] leading-none font-bold text-white tracking-tight mb-2">
                  {salesLoading ? <SkeletonBlock className="h-10 w-24 bg-white/20" /> : <AnimatedNumber value={salesData?.totalQuantity || 0} />}
                </div>
                <p className="text-[13px] text-white/80 font-medium">Total Quantity Sold <span className="opacity-70 ml-1">vs last month</span></p>
              </div>
            </motion.div>

            {/* 2. Light Card: Challans */}
            <motion.div whileHover={!shouldReduceMotion ? { y: -2 } : {}} className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[160px] transition-transform">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.bg, color: PALETTE.textMuted }}>
                  <FileText size={22} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: PALETTE.successBg, color: PALETTE.successText }}>
                  <ArrowUpRight size={14} strokeWidth={3} />
                  <span>+5%</span>
                </div>
              </div>
              <div>
                <div className="text-[40px] leading-none font-bold tracking-tight mb-2" style={{ color: PALETTE.textDark }}>
                  {salesLoading ? <SkeletonBlock className="h-10 w-16" /> : <AnimatedNumber value={totalChallans} />}
                </div>
                <p className="text-[13px] font-medium" style={{ color: PALETTE.textMuted }}>Challans This Month <span className="opacity-70 ml-1">vs last month</span></p>
              </div>
            </motion.div>

            {/* 3. Light Card: Low Stock */}
            <motion.div whileHover={!shouldReduceMotion ? { y: -2 } : {}} className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[160px] transition-transform">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: inventoryData?.lowStockCount > 0 ? PALETTE.dangerBg : PALETTE.bg, color: inventoryData?.lowStockCount > 0 ? PALETTE.secondary : PALETTE.textMuted }}>
                  <AlertTriangle size={22} strokeWidth={2.5} />
                </div>
                {inventoryData?.lowStockCount > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: PALETTE.dangerBg, color: PALETTE.dangerText }}>
                    <ArrowUpRight size={14} strokeWidth={3} />
                    <span>Alerts</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[40px] leading-none font-bold tracking-tight mb-2" style={{ color: PALETTE.textDark }}>
                  {inventoryLoading ? <SkeletonBlock className="h-10 w-16" /> : <AnimatedNumber value={inventoryData?.lowStockCount || 0} />}
                </div>
                <p className="text-[13px] font-medium" style={{ color: PALETTE.textMuted }}>Low Stock Alerts <span className="opacity-70 ml-1">vs last month</span></p>
              </div>
            </motion.div>

            {/* 4. Light Card: Products Sold */}
            <motion.div whileHover={!shouldReduceMotion ? { y: -2 } : {}} className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[160px] transition-transform">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.bg, color: PALETTE.textMuted }}>
                  <Package size={22} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: PALETTE.successBg, color: PALETTE.successText }}>
                  <ArrowUpRight size={14} strokeWidth={3} />
                  <span>+8%</span>
                </div>
              </div>
              <div>
                <div className="text-[40px] leading-none font-bold tracking-tight mb-2" style={{ color: PALETTE.textDark }}>
                  {inventoryLoading ? <SkeletonBlock className="h-10 w-16" /> : <AnimatedNumber value={inventoryData?.movementSummary?.reduce((acc: number, cur: any) => acc + cur.out, 0) || 0} />}
                </div>
                <p className="text-[13px] font-medium" style={{ color: PALETTE.textMuted }}>Products Sold <span className="opacity-70 ml-1">vs last month</span></p>
              </div>
            </motion.div>

          </motion.div>

          {/* BOTTOM-LEFT: Sales Activity Bar Chart */}
          <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col min-h-[380px] flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold" style={{ color: PALETTE.textDark }}>Sales Activity</h3>
                <p className="text-[13px] mt-0.5" style={{ color: PALETTE.textMuted }}>Track challan volume over time</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-3 mr-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: PALETTE.textMuted }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE.primary }} /> Confirmed</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: PALETTE.textMuted }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE.chartGray }} /> Draft</span>
                </div>
                <DateDropdown id="sales" label="This Month" />
              </div>
            </div>

            <div className="flex-1 w-full min-h-[250px] mt-4">
              {salesLoading ? (
                <div className="h-full flex items-end gap-2 p-4">
                  {[...Array(10)].map((_, i) => <SkeletonBlock key={i} className="w-full flex-1" style={{ height: `${Math.random() * 80 + 20}%`}} />)}
                </div>
              ) : salesData?.trends?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.trends} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{fontSize: 11, fill: PALETTE.textMuted, fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 11, fill: PALETTE.textMuted, fontWeight: 500}} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: PALETTE.bg }} />
                    <Bar name="Confirmed" dataKey="confirmed" fill={PALETTE.primary} radius={[4, 4, 0, 0]} isAnimationActive={!shouldReduceMotion} animationDuration={800} />
                    <Bar name="Draft" dataKey="draft" fill={PALETTE.chartGray} radius={[4, 4, 0, 0]} isAnimationActive={!shouldReduceMotion} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm rounded-lg" style={{ color: PALETTE.textMuted, backgroundColor: PALETTE.bg }}>
                  No sales activity in this period.
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* TOP-RIGHT: Customer Statistic */}
          <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col min-h-[344px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold" style={{ color: PALETTE.textDark }}>Customer Statistic</h3>
              <DateDropdown id="stat" label="This Month" />
            </div>
            
            {customerLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 mt-6">
                <SkeletonBlock className="h-40 w-40 rounded-full" />
                <div className="w-full space-y-3"><SkeletonBlock className="h-6 w-full"/><SkeletonBlock className="h-6 w-full"/></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={fromStr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col mt-6">
                  
                  <div className="h-[200px] w-full flex items-center justify-center mb-8 relative">
                    <MultiArcProgress 
                      outerValue={activePct} 
                      innerValue={leadPct} 
                      outerColor={PALETTE.primary}
                      innerColor={PALETTE.secondary}
                      trackColor={PALETTE.bg}
                    >
                      <span className="text-[28px] font-bold tracking-tight leading-none mb-1" style={{ color: PALETTE.textDark }}>
                        <AnimatedNumber value={totalCustomers} />
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: PALETTE.successBg, color: PALETTE.successText }}>
                        +5.34%
                      </span>
                    </MultiArcProgress>
                  </div>
                  
                  {/* Legend List matching spec */}
                  <div className="space-y-1.5 flex-1">
                    {customerData?.typeCounts?.map((entry: any, i: number) => {
                      return (
                        <div key={entry.name} className="flex items-center justify-between p-2.5 rounded-[12px] hover:bg-[#F1F1F9] transition-colors">
                          <div className="flex items-center gap-3 w-1/3">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: CUSTOMER_COLORS[i % CUSTOMER_COLORS.length] }} />
                            <span className="text-[13px] font-semibold capitalize" style={{ color: PALETTE.textDark }}>{entry.name.toLowerCase()}</span>
                          </div>
                          <div className="w-1/3 text-center">
                            <span className="text-[13px] font-bold" style={{ color: PALETTE.textMuted }}><AnimatedNumber value={entry.value} /></span>
                          </div>
                          <div className="w-1/3 flex justify-end">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: PALETTE.successBg, color: PALETTE.successText }}>
                              +{(Math.random() * 10 + 1).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>

          {/* BOTTOM-RIGHT: Customer Mix */}
          <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col min-h-[380px] flex-1">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-bold" style={{ color: PALETTE.textDark }}>Customer Mix</h3>
                <p className="text-[13px] mt-0.5" style={{ color: PALETTE.textMuted }}>By customer type</p>
              </div>
              <DateDropdown id="mix" label="Today" />
            </div>
            
            {customerLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 mt-6">
                <SkeletonBlock className="h-40 w-40 rounded-full" />
                <div className="w-full space-y-3"><SkeletonBlock className="h-6 w-full"/><SkeletonBlock className="h-6 w-full"/></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={fromStr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col mt-2">
                  
                  <div className="h-[220px] w-full mb-4">
                    <BubbleCluster data={bubbleData} />
                  </div>
                  
                  {/* Legend List (Customer Types) */}
                  <div className="space-y-1.5 flex-1">
                    {bubbleData.map((entry: any, i: number) => {
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-[12px] hover:bg-[#F1F1F9] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm" style={{ backgroundColor: CUSTOMER_COLORS[i % CUSTOMER_COLORS.length] }}>
                              <Users size={12} className="text-white" />
                            </div>
                            <span className="text-[13px] font-semibold capitalize" style={{ color: PALETTE.textDark }}>{entry.label.toLowerCase()}</span>
                          </div>
                          <div>
                            <span className="text-[14px] font-bold" style={{ color: PALETTE.textDark }}><AnimatedNumber value={entry.value} /></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>

        </div>
      </motion.div>

      {/* Relocated Sections: Inventory Table & Needs Attention List */}
      <motion.div variants={!shouldReduceMotion ? listContainer : undefined} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 pt-8 border-t border-[#E4E7EC]">
        
        {/* Inventory Table */}
        <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="bg-white rounded-[24px] p-6 shadow-sm">
          <h3 className="text-lg font-bold border-b border-[#E4E7EC] pb-3" style={{ color: PALETTE.textDark }}>Stock Movements (In Range)</h3>
          {inventoryLoading ? (
            <div className="space-y-4 mt-4">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ) : (
            <div className="mt-4 rounded-xl overflow-hidden shadow-sm max-h-[400px] flex flex-col" style={{ border: `1px solid ${PALETTE.chartGray}` }}>
              <table className="w-full text-left text-[13px]">
                <thead className="text-[11px] uppercase font-bold" style={{ backgroundColor: PALETTE.bg, color: PALETTE.textMuted }}>
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">In</th>
                    <th className="px-4 py-3 text-right">Out</th>
                    <th className="px-4 py-3 text-right">Net</th>
                  </tr>
                </thead>
              </table>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-[13px]">
                  <tbody className="divide-y" style={{ borderColor: PALETTE.chartGray, backgroundColor: PALETTE.cardBg }}>
                    {inventoryData?.movementSummary?.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center" style={{ color: PALETTE.textMuted }}>No stock movements recorded</td></tr>
                    ) : (
                      inventoryData?.movementSummary?.map((m: any) => (
                        <tr key={m.id} className="hover:bg-[#F1F1F9] transition-colors">
                          <td className="px-4 py-3 font-semibold truncate max-w-[150px]" style={{ color: PALETTE.textDark }}>{m.name}</td>
                          <td className="px-4 py-3 text-right font-medium w-20" style={{ color: PALETTE.successText }}>+{m.in}</td>
                          <td className="px-4 py-3 text-right font-medium w-20" style={{ color: PALETTE.dangerText }}>-{m.out}</td>
                          <td className="px-4 py-3 text-right w-20">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold`} style={{ backgroundColor: m.net > 0 ? PALETTE.successBg : m.net < 0 ? PALETTE.dangerBg : PALETTE.bg, color: m.net > 0 ? PALETTE.successText : m.net < 0 ? PALETTE.dangerText : PALETTE.textMuted }}>
                              {m.net > 0 ? '+' : ''}{m.net}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* Needs Attention List */}
        <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="bg-white rounded-[24px] p-6 shadow-sm">
          <h3 className="text-lg font-bold border-b border-[#E4E7EC] pb-3" style={{ color: PALETTE.textDark }}>Follow-ups Needs Attention</h3>
          {followupLoading ? (
            <div className="space-y-4 mt-4">
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-16 w-full" />
            </div>
          ) : (
            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {followupData?.overdueCustomers?.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center rounded-[16px]" style={{ backgroundColor: PALETTE.bg, border: `1px solid ${PALETTE.chartGray}` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: PALETTE.successBg, color: PALETTE.successText }}>
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-base font-bold" style={{ color: PALETTE.textDark }}>All caught up!</h4>
                  <p className="text-[13px] mt-1" style={{ color: PALETTE.textMuted }}>Great job! No overdue follow-ups.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followupData?.overdueCustomers?.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center p-3.5 rounded-[16px] shadow-sm transition-colors hover:border-[#4A55C7]" style={{ backgroundColor: PALETTE.cardBg, border: `1px solid ${PALETTE.chartGray}` }}>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: PALETTE.textDark }}>{c.name}</p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: PALETTE.textMuted }}>{c.mobile}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mb-1" style={{ backgroundColor: PALETTE.dangerBg, color: PALETTE.dangerText }}>
                          {dayjs(c.followUpDate).fromNow()}
                        </p>
                        <p className="text-[10px] uppercase font-bold block" style={{ color: PALETTE.textMuted }}>{c.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
