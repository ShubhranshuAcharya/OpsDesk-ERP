import { motion, useReducedMotion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface BubbleData {
  id: string;
  value: number;
  label: string;
}

export function BubbleCluster({ data }: { data: BubbleData[] }) {
  const shouldReduceMotion = useReducedMotion();
  
  if (!data || data.length === 0) return null;

  // Sort by value descending so largest is first
  const sorted = [...data].sort((a, b) => b.value - a.value);
  
  const containerSize = 250;
  
  const bubbles = [
    { ...sorted[0], r: 75, cx: 95, cy: 125, opacity: 1, delay: 0 },
    { ...sorted[1], r: 55, cx: 185, cy: 85, opacity: 0.7, delay: 0.1 },
    { ...sorted[2], r: 40, cx: 175, cy: 180, opacity: 0.4, delay: 0.2 },
  ];

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[250px]">
      <svg width={containerSize} height={containerSize} viewBox={`0 0 ${containerSize} ${containerSize}`}>
        {bubbles.map((b, i) => {
          if (!b || !b.id) return null;
          return (
            <g key={b.id}>
              <motion.circle
                cx={b.cx}
                cy={b.cy}
                fill={`rgba(74, 85, 199, ${b.opacity})`}
                initial={!shouldReduceMotion ? { r: 0 } : { r: b.r }}
                animate={{ r: b.r }}
                transition={{ type: 'spring', bounce: 0.4, delay: b.delay, duration: 0.8 }}
              />
              <motion.text
                x={b.cx}
                y={b.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                className="font-bold tracking-tight"
                fontSize={b.r / 2.5}
                initial={!shouldReduceMotion ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ delay: b.delay + 0.3, duration: 0.5 }}
              >
                {b.value}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
