import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { AdjustStockModal } from '../components/inventory/AdjustStockModal';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { motion, useReducedMotion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Users, UserCheck, AlertTriangle, FileText, Package, CalendarClock,
  Clock, CheckCircle2, Calendar, Plus, Activity, TrendingUp
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const rowContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const rowItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

// Live Restock Flash implementation
const LiveRow = ({ item, children, onClick, shouldReduceMotion }: any) => {
  const [flashing, setFlashing] = useState(false);
  const [prevStock, setPrevStock] = useState(item.currentStock);

  useEffect(() => {
    if (item.currentStock > prevStock) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 2000);
      setPrevStock(item.currentStock);
      return () => clearTimeout(timer);
    } else {
      setPrevStock(item.currentStock);
    }
  }, [item.currentStock, prevStock]);

  return (
    <motion.tr 
      variants={!shouldReduceMotion ? rowItemVariants : undefined}
      onClick={onClick}
      className={`hover:bg-ops-bg-base transition-colors cursor-pointer ${flashing ? 'bg-ops-success-bg/30' : ''}`}
      animate={flashing ? { backgroundColor: 'var(--color-success-bg)' } : { backgroundColor: 'transparent' }}
      transition={{ duration: 1 }}
    >
      {children(flashing)}
    </motion.tr>
  );
};

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [restockTarget, setRestockTarget] = useState<{ id: string; name: string; sku: string; currentStock: number } | null>(null);
  const canAdjustStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';
  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-[120px] bg-ops-bg-surface border border-ops-border-default rounded-ops-md"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px] bg-ops-bg-surface border border-ops-border-default rounded-ops-md"></div>
          <div className="h-[300px] bg-ops-bg-surface border border-ops-border-default rounded-ops-md"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState 
        icon={<AlertTriangle size={24} className="text-ops-danger" />}
        title="Failed to load dashboard"
        description="We couldn't reach the server to fetch your operations data."
        actionText="Retry"
        actionOnClick={() => window.location.reload()}
      />
    );
  }

  const { kpis, panels } = data;
  const showFollowUps = isSalesOrAdmin;

  // Pipeline math
  const pipelineTotal = (panels.challanPipeline?.DRAFT || 0) + (panels.challanPipeline?.CONFIRMED || 0) + (panels.challanPipeline?.CANCELLED || 0);
  const draftPct = pipelineTotal ? ((panels.challanPipeline?.DRAFT || 0) / pipelineTotal) * 100 : 0;
  const confirmedPct = pipelineTotal ? ((panels.challanPipeline?.CONFIRMED || 0) / pipelineTotal) * 100 : 0;
  const cancelledPct = pipelineTotal ? ((panels.challanPipeline?.CANCELLED || 0) / pipelineTotal) * 100 : 0;

  return (
    <motion.div 
      variants={!shouldReduceMotion ? containerVariants : undefined}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      
      {/* Welcome Header & Quick Actions */}
      <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-ops-lg font-semibold text-ops-text-primary">Welcome back, {user?.name.split(' ')[0]}</h2>
          <p className="text-ops-sm text-ops-text-secondary mt-1">Here is what's happening in your operations today.</p>
        </div>
        
        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center gap-3">
          {isSalesOrAdmin && (
            <button onClick={() => navigate('/customers')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-ops-bg-surface border border-ops-border-default rounded-ops-md text-ops-sm font-medium text-ops-text-primary hover:bg-ops-bg-base hover:border-ops-primary/50 transition-all shadow-sm">
              <Plus size={14} className="text-ops-primary" /> New Customer
            </button>
          )}
          {canAdjustStock && (
            <button onClick={() => navigate('/inventory')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-ops-bg-surface border border-ops-border-default rounded-ops-md text-ops-sm font-medium text-ops-text-primary hover:bg-ops-bg-base hover:border-ops-primary/50 transition-all shadow-sm">
              <Plus size={14} className="text-ops-primary" /> New Product
            </button>
          )}
          {isSalesOrAdmin && (
            <button onClick={() => navigate('/challans')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-ops-primary text-white rounded-ops-md text-ops-sm font-medium hover:bg-ops-primary-hover transition-all shadow-sm">
              <Plus size={14} /> New Challan
            </button>
          )}
        </div>
      </motion.div>

      {/* Row 1: KPI Grid */}
      <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Customers" 
          value={<AnimatedNumber value={kpis.totalCustomers.value} />} 
          delta={kpis.totalCustomers.delta} 
          icon={<Users size={16} />}
          to="/customers"
        />
        <StatCard 
          title="Active Leads" 
          value={<AnimatedNumber value={kpis.activeLeads.value} />} 
          delta={kpis.activeLeads.delta} 
          icon={<UserCheck size={16} />}
          to="/customers"
        />
        <StatCard 
          title="Low Stock Items" 
          value={<AnimatedNumber value={kpis.lowStockItems.value} />} 
          delta={kpis.lowStockItems.delta}
          deltaType="decrease_is_good" 
          icon={<AlertTriangle size={16} />}
          to="/inventory"
        />
        <StatCard 
          title="Challans This Month" 
          value={<AnimatedNumber value={kpis.challansThisMonth.value} />} 
          delta={kpis.challansThisMonth.delta} 
          icon={<FileText size={16} />}
          to="/challans"
        />
      </motion.div>

      {/* Row 2: Challan Pipeline & Top Products */}
      <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Challan Pipeline */}
        <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-ops-sm font-semibold text-ops-text-primary flex items-center gap-2">
              <TrendingUp size={16} className="text-ops-text-muted" /> Challan Pipeline (This Month)
            </h3>
          </div>
          {pipelineTotal === 0 ? (
            <div className="text-ops-sm text-ops-text-muted text-center py-4">No challans this month.</div>
          ) : (
            <div className="space-y-4">
              {/* Horizontal Bar */}
              <div className="h-4 w-full flex rounded-full overflow-hidden bg-ops-bg-base border border-ops-border-default">
                <motion.div 
                  initial={!shouldReduceMotion ? { width: 0 } : false} 
                  animate={{ width: `${draftPct}%` }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-ops-text-muted h-full cursor-pointer hover:brightness-110" 
                  title="Draft"
                  onClick={() => navigate('/challans?status=DRAFT')}
                />
                <motion.div 
                  initial={!shouldReduceMotion ? { width: 0 } : false} 
                  animate={{ width: `${confirmedPct}%` }} 
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="bg-ops-primary h-full cursor-pointer hover:brightness-110" 
                  title="Confirmed"
                  onClick={() => navigate('/challans?status=CONFIRMED')}
                />
                <motion.div 
                  initial={!shouldReduceMotion ? { width: 0 } : false} 
                  animate={{ width: `${cancelledPct}%` }} 
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="bg-ops-danger h-full cursor-pointer hover:brightness-110" 
                  title="Cancelled"
                  onClick={() => navigate('/challans?status=CANCELLED')}
                />
              </div>
              {/* Labels */}
              <div className="flex justify-between text-ops-xs font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ops-text-muted"/> Draft: <AnimatedNumber value={panels.challanPipeline?.DRAFT || 0} /></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ops-primary"/> Confirmed: <AnimatedNumber value={panels.challanPipeline?.CONFIRMED || 0} /></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ops-danger"/> Cancelled: <AnimatedNumber value={panels.challanPipeline?.CANCELLED || 0} /></div>
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-ops-sm font-semibold text-ops-text-primary flex items-center gap-2">
              <Package size={16} className="text-ops-text-muted" /> Top Products Moved (Out)
            </h3>
          </div>
          {panels.topProducts?.length === 0 ? (
            <div className="text-ops-sm text-ops-text-muted text-center py-4">No outbound movements this month.</div>
          ) : (
            <motion.div variants={!shouldReduceMotion ? rowContainerVariants : undefined} initial="hidden" animate="show" className="space-y-2">
              {panels.topProducts?.map((tp: any, i: number) => (
                <motion.div variants={!shouldReduceMotion ? rowItemVariants : undefined} key={tp.id} className="flex justify-between items-center p-2 rounded-ops-sm hover:bg-ops-bg-base transition-colors border border-transparent hover:border-ops-border-default">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-ops-primary/10 text-ops-primary font-bold text-[10px]">{i+1}</span>
                    <span className="text-ops-sm font-medium text-ops-text-primary">{tp.name}</span>
                  </div>
                  <span className="text-ops-sm font-semibold text-ops-text-primary"><AnimatedNumber value={tp.quantity} /></span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </motion.div>

      {/* Row 3: Stock Alerts & Follow-ups */}
      <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stock Alerts Panel */}
        <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm flex flex-col h-[300px] sm:h-[360px]">
          <div className="h-12 px-4 border-b border-ops-border-default flex items-center justify-between shrink-0">
            <h3 className="text-ops-sm font-semibold text-ops-text-primary flex items-center gap-2">
              <AlertTriangle size={16} className="text-ops-text-muted" /> Stock Alerts
            </h3>
            {panels.stockAlerts.length > 0 && (
              <span className="text-[11px] font-medium text-ops-danger bg-ops-danger-bg px-2 py-0.5 rounded-full animate-pulse-slow">
                {panels.stockAlerts.length} Critical
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {panels.stockAlerts.length === 0 ? (
              <EmptyState 
                icon={<CheckCircle2 size={24} className="text-ops-success" />}
                title="No stock alerts"
                description="Inventory levels look healthy across all tracked items."
              />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-ops-bg-base border-b border-ops-border-default z-10">
                  <tr>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase">Product</th>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase text-right">Stock</th>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase text-right">Action</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={!shouldReduceMotion ? rowContainerVariants : undefined} 
                  initial="hidden" animate="show"
                  className="divide-y divide-ops-border-default"
                >
                  {panels.stockAlerts.map((item: any) => (
                    <LiveRow key={item.id} item={item} shouldReduceMotion={shouldReduceMotion} onClick={() => navigate('/inventory')}>
                      {(flashing: boolean) => (
                        <>
                          <td className="px-4 py-3">
                            <p className="text-ops-sm font-medium text-ops-text-primary">{item.name}</p>
                            <p className="text-ops-xs text-ops-text-muted">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <motion.span 
                              animate={flashing ? { scale: [1, 1.2, 1] } : {}} 
                              transition={{ duration: 0.3 }}
                              className={`text-ops-sm font-semibold inline-block ${flashing ? 'text-ops-success' : 'text-ops-danger'}`}
                            >
                              {item.currentStock}
                            </motion.span>
                            <span className="text-[10px] text-ops-text-muted ml-1">/ {item.minStockAlert}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canAdjustStock ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRestockTarget({ id: item.id, name: item.name, sku: item.sku, currentStock: item.currentStock });
                                }}
                                className="text-ops-xs font-semibold text-ops-primary hover:text-ops-primary-hover underline underline-offset-2 transition-colors"
                              >
                                Restock
                              </button>
                            ) : (
                              <span className="text-ops-xs text-ops-text-muted cursor-default" title="Only Admin or Warehouse users can adjust stock">Restock</span>
                            )}
                          </td>
                        </>
                      )}
                    </LiveRow>
                  ))}
                </motion.tbody>
              </table>
            )}
          </div>
        </div>

        {/* Follow-ups Due Today Panel */}
        {showFollowUps && (
          <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm flex flex-col h-[300px] sm:h-[360px]">
            <div className="h-12 px-4 border-b border-ops-border-default flex items-center justify-between shrink-0">
              <h3 className="text-ops-sm font-semibold text-ops-text-primary flex items-center gap-2">
                <CalendarClock size={16} className="text-ops-text-muted" /> Follow-ups Due Today
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              {panels.followUpsToday.length === 0 ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                  <EmptyState 
                    icon={<CheckCircle2 size={24} className="text-ops-success" />}
                    title="All caught up!"
                    description="You have no customer follow-ups scheduled for today."
                  />
                </motion.div>
              ) : (
                <motion.ul variants={!shouldReduceMotion ? rowContainerVariants : undefined} initial="hidden" animate="show" className="divide-y divide-ops-border-default">
                  {panels.followUpsToday.map((customer: any) => (
                    <motion.li 
                      variants={!shouldReduceMotion ? rowItemVariants : undefined}
                      key={customer.id} 
                      className="p-4 hover:bg-ops-bg-base transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => navigate('/customers')}
                    >
                      <div>
                        <p className="text-ops-sm font-medium text-ops-text-primary">{customer.name}</p>
                        <p className="text-ops-xs text-ops-text-muted">{customer.businessName || customer.mobile}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate('/customers'); }}
                          className="w-8 h-8 flex items-center justify-center rounded border border-ops-border-default text-ops-text-secondary hover:text-ops-primary hover:border-ops-primary bg-ops-bg-surface transition-colors"
                          title="Mark Done"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </div>
        )}

      </motion.div>

      {/* Row 4: Recent Challans & Recent Activity Feed */}
      <motion.div variants={!shouldReduceMotion ? itemVariants : undefined} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Sales Challans */}
        <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm flex flex-col h-auto max-h-[400px]">
          <div className="h-12 px-4 border-b border-ops-border-default flex items-center justify-between shrink-0">
            <h3 className="text-ops-sm font-semibold text-ops-text-primary flex items-center gap-2">
              <Clock size={16} className="text-ops-text-muted" /> Recent Sales Challans
            </h3>
            <button onClick={() => navigate('/challans')} className="text-ops-xs font-medium text-ops-primary hover:text-ops-primary-hover">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {panels.recentChallans.length === 0 ? (
              <EmptyState 
                icon={<FileText size={24} className="text-ops-text-muted" />}
                title="No recent challans"
                description="Create a sales challan to track goods delivery."
                actionText="Create Challan"
                actionTo="/challans"
              />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-ops-bg-base border-b border-ops-border-default">
                  <tr>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase">Challan #</th>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase">Customer</th>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase">Date</th>
                    <th className="px-4 py-2 text-ops-xs font-medium text-ops-text-secondary uppercase text-right">Status</th>
                  </tr>
                </thead>
                <motion.tbody variants={!shouldReduceMotion ? rowContainerVariants : undefined} initial="hidden" animate="show" className="divide-y divide-ops-border-default">
                  {panels.recentChallans.map((challan: any) => (
                    <motion.tr variants={!shouldReduceMotion ? rowItemVariants : undefined} key={challan.id} className="hover:bg-ops-bg-base transition-colors cursor-pointer" onClick={() => navigate('/challans')}>
                      <td className="px-4 py-3"><p className="text-ops-sm font-medium text-ops-text-primary">{challan.challanNumber}</p></td>
                      <td className="px-4 py-3"><p className="text-ops-sm text-ops-text-secondary">{challan.customer?.name || 'Unknown'}</p></td>
                      <td className="px-4 py-3"><p className="text-ops-sm text-ops-text-secondary">{dayjs(challan.createdAt).fromNow()}</p></td>
                      <td className="px-4 py-3 text-right">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="inline-block">
                          <StatusBadge status={challan.status} />
                        </motion.div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm flex flex-col h-[300px] sm:h-[400px]">
          <div className="h-12 px-4 border-b border-ops-border-default flex items-center justify-between shrink-0">
            <h3 className="text-ops-sm font-semibold text-ops-text-primary flex items-center gap-2">
              <Activity size={16} className="text-ops-text-muted" /> Recent Activity Feed
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {panels.recentActivity?.length === 0 ? (
              <div className="text-ops-sm text-ops-text-muted text-center py-8">No recent activity.</div>
            ) : (
              <motion.ul variants={!shouldReduceMotion ? rowContainerVariants : undefined} initial="hidden" animate="show" className="divide-y divide-ops-border-default">
                {panels.recentActivity?.map((activity: any) => (
                  <motion.li variants={!shouldReduceMotion ? rowItemVariants : undefined} key={activity.id + activity.date} className="p-3.5 hover:bg-ops-bg-base transition-colors flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-ops-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-ops-sm text-ops-text-primary">{activity.actionStr}</p>
                      <p className="text-ops-xs text-ops-text-muted mt-0.5">{dayjs(activity.date).fromNow()}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>

      </motion.div>

      {/* Restock Modal */}
      {restockTarget && (
        <AdjustStockModal
          isOpen={!!restockTarget}
          onClose={() => setRestockTarget(null)}
          productId={restockTarget.id}
          productName={`${restockTarget.name} (${restockTarget.sku})`}
          currentStock={restockTarget.currentStock}
          defaultMovementType="IN"
        />
      )}

    </motion.div>
  );
}
