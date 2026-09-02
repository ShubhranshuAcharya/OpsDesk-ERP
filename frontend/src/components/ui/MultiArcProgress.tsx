import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';

interface MultiArcProgressProps {
  outerValue: number; // 0-100
  innerValue: number; // 0-100
  outerColor?: string;
  innerColor?: string;
  trackColor?: string;
  children?: ReactNode;
}

export function MultiArcProgress({
  outerValue,
  innerValue,
  outerColor = '#4A55C7',
  innerColor = '#F35B5B',
  trackColor = '#E4E7EC',
  children
}: MultiArcProgressProps) {
  const shouldReduceMotion = useReducedMotion();

  // SVG parameters
  const size = 200;
  const strokeWidth = 14;
  const center = size / 2;
  
  const outerRadius = (size - strokeWidth) / 2 - 5;
  const innerRadius = outerRadius - strokeWidth - 8;

  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const outerOffset = outerCircumference - (Math.min(100, Math.max(0, outerValue)) / 100) * outerCircumference;
  const innerOffset = innerCircumference - (Math.min(100, Math.max(0, innerValue)) / 100) * innerCircumference;

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[200px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 drop-shadow-sm">
        {/* Tracks */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress Arcs */}
        <motion.circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={outerColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          initial={!shouldReduceMotion ? { strokeDashoffset: outerCircumference } : { strokeDashoffset: outerOffset }}
          animate={{ strokeDashoffset: outerOffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={innerColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={innerCircumference}
          initial={!shouldReduceMotion ? { strokeDashoffset: innerCircumference } : { strokeDashoffset: innerOffset }}
          animate={{ strokeDashoffset: innerOffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}
