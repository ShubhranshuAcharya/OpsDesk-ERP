import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
}

export function AnimatedNumber({ value }: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const spring = useSpring(0, {
    damping: 30,
    stiffness: 100,
    restDelta: 0.5
  });

  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (shouldReduceMotion) {
      spring.jump(value);
    } else {
      spring.set(value);
    }
  }, [spring, value, shouldReduceMotion]);

  return <motion.span>{display}</motion.span>;
}
