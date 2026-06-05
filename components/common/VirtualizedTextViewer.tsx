
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface VirtualizedTextViewerProps {
  content: string;
  className?: string;
  lineHeight?: number;
}

const VirtualizedTextViewer: React.FC<VirtualizedTextViewerProps> = ({ 
  content, 
  className = '', 
  lineHeight = 20 // Approximate line height in pixels for monospace font
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  const lines = useMemo(() => content.split('\n'), [content]);
  const totalLines = lines.length;
  const totalHeight = totalLines * lineHeight;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    // Initial measure
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calculate visible range
  const startNode = Math.floor(scrollTop / lineHeight);
  // Render a few extra lines buffer
  const visibleNodeCount = Math.ceil(containerHeight / lineHeight) + 5; 
  const endNode = Math.min(totalLines, startNode + visibleNodeCount);

  const visibleLines = [];
  for (let i = startNode; i < endNode; i++) {
    visibleLines.push(
      <div 
        key={i} 
        style={{ 
          position: 'absolute', 
          top: i * lineHeight, 
          left: 0, 
          right: 0, 
          height: lineHeight,
          whiteSpace: 'pre',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        className="px-2"
      >
        <span className="inline-block w-8 text-gray-600 select-none text-right mr-4 opacity-50">{i + 1}</span>
        {lines[i]}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto font-mono text-sm leading-[20px] ${className}`}
      onScroll={handleScroll}
      style={{ height: '100%' }} // Ensure it takes full parent height
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleLines}
      </div>
    </div>
  );
};

export default VirtualizedTextViewer;
