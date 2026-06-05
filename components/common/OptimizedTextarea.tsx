
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface OptimizedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  debounceMs?: number;
}

const OptimizedTextarea: React.FC<OptimizedTextareaProps> = ({ 
  value, 
  onChange, 
  debounceMs = 300,
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  // Sync with parent value updates (e.g. file load, clear)
  // Only update if we are not currently typing to avoid cursor jumps or race conditions
  useEffect(() => {
    if (!isTypingRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.persist(); // React 16 legacy, but safe to keep for compatibility if needed
    const newValue = e.target.value;
    
    setLocalValue(newValue);
    isTypingRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      onChange(e); // Propagate up
      isTypingRef.current = false;
    }, debounceMs);
  }, [onChange, debounceMs]);

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
};

export default OptimizedTextarea;
