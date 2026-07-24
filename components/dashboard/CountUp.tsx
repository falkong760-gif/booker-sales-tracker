'use client';

import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number; // duration in ms
  prefix?: string;
}

export default function CountUp({ value, duration = 800, prefix = 'Rs. ' }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = prevValueRef.current;
    const endValue = value;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      const current = Math.floor(easedProgress * (endValue - startValue) + startValue);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    window.requestAnimationFrame(step);

    return () => {
      prevValueRef.current = value;
    };
  }, [value, duration]);

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(displayValue);

  return <span>{prefix}{formatted}</span>;
}
