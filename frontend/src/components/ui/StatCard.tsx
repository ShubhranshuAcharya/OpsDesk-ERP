import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  delta?: number; // Percentage change (optional)
  deltaType?: 'increase_is_good' | 'decrease_is_good' | 'neutral';
  icon?: ReactNode;
  to?: string; // Route to navigate when clicked
}

export default function StatCard({ 
  title, 
  value, 
  delta, 
  deltaType = 'increase_is_good',
  icon,
  to
}: StatCardProps) {
  
  const hasDelta = delta !== undefined;
  const isPositive = hasDelta && delta! > 0;
  const isZero = hasDelta && delta === 0;

  let trendColor = 'text-ops-text-muted';
  let trendBg = 'bg-ops-bg-base';

  if (!isZero) {
    if (deltaType === 'increase_is_good') {
      trendColor = isPositive ? 'text-ops-success' : 'text-ops-danger';
      trendBg = isPositive ? 'bg-ops-success-bg' : 'bg-ops-danger-bg';
    } else if (deltaType === 'decrease_is_good') {
      trendColor = isPositive ? 'text-ops-danger' : 'text-ops-success';
      trendBg = isPositive ? 'bg-ops-danger-bg' : 'bg-ops-success-bg';
    }
  }

  const MotionLink = motion(Link);
  const CardWrapper = to ? MotionLink : motion.div;
  const wrapperProps = to ? { to } : {};

  return (
    <CardWrapper 
      {...(wrapperProps as any)}
      whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
      transition={{ duration: 0.15 }}
      className={`block h-full group ${to ? 'cursor-pointer' : ''}`}
    >
      <div className={`p-4 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm h-full flex flex-col justify-between transition-colors duration-200 ease-in-out group-hover:bg-ops-text-primary group-hover:border-ops-text-primary`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-ops-sm font-medium text-ops-text-secondary transition-colors duration-200 ease-in-out group-hover:text-white">{title}</h3>
          {icon && (
            <div className="w-8 h-8 rounded-ops-sm bg-ops-bg-base flex items-center justify-center text-ops-text-secondary transition-colors duration-200 ease-in-out group-hover:bg-white/20 group-hover:text-white">
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div className="text-ops-xl font-semibold text-ops-text-primary tracking-tight transition-colors duration-200 ease-in-out group-hover:text-white">
            {value}
          </div>
          {hasDelta && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }} // Delayed so it appears after the number count-up finishes
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors duration-200 ease-in-out group-hover:bg-white/10 ${trendBg} ${trendColor}`}
            >
              {isZero ? (
                <TrendingUp size={12} className="opacity-50" />
              ) : isPositive ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              <span>{isPositive ? '+' : ''}{delta}%</span>
            </motion.div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
