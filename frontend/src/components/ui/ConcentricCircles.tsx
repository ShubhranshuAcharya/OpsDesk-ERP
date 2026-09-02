import { motion, useReducedMotion } from 'framer-motion';

interface CircleData {
  id: string;
  label: string;
  value: number;
  color: string;
  opacity: number;
}

interface ConcentricCirclesProps {
  data: CircleData[]; // Assume pre-sorted largest to smallest for rendering order (largest in back)
}

export function ConcentricCircles({ data }: ConcentricCirclesProps) {
  const shouldReduceMotion = useReducedMotion();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-ops-text-muted text-ops-sm">
        No data available
      </div>
    );
  }

  // Calculate relative sizes. Largest is 100% of container.
  // The subsequent ones scale based on their share of the total or relative to the max.
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
      <div className="relative w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] flex items-center justify-center">
      {data.map((item, index) => {
        // Size as a percentage of the max value's size (minimum 20% so it's visible)
        const sizePercentage = Math.max(20, (item.value / maxValue) * 100);
        const percentage = Math.round((item.value / total) * 100);

        return (
          <motion.div
            key={item.id}
            initial={{ scale: shouldReduceMotion ? 1 : 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 20,
              delay: shouldReduceMotion ? 0 : index * 0.15
            }}
            className="absolute rounded-full flex items-center justify-center border border-white/10"
            style={{
              width: `${sizePercentage}%`,
              height: `${sizePercentage}%`,
              backgroundColor: item.color,
              opacity: item.opacity,
              zIndex: data.length - index // largest (index 0) gets lowest z-index
            }}
          >
            {/* Display percentage if it's large enough to read easily */}
            {sizePercentage > 30 && (
              <span className="text-white font-bold drop-shadow-sm text-sm sm:text-base">
                {percentage}%
              </span>
            )}
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}
