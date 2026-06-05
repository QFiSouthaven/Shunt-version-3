
import React, { useState } from 'react';
import { ShuntAction } from '../../types';
import Loader from '../Loader';
import { StarIcon } from '../icons';

interface ShuntButtonProps {
  onClick: () => void;
  disabled: boolean;
  isActive: boolean;
  children: React.ReactNode;
  action: ShuntAction | string;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, action: ShuntAction) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>, action: ShuntAction) => void;
  tooltip: string;
  className?: string;
  onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>, action: ShuntAction) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>, action: ShuntAction) => void;
  onTouchCancel?: () => void;
  // Pinning Props
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const ShuntButton: React.FC<ShuntButtonProps> = ({ 
  onClick, 
  disabled, 
  isActive, 
  children, 
  action,
  onDragStart,
  onDrop,
  tooltip,
  className = '',
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  isPinned = false,
  onTogglePin
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => e.preventDefault();

  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const draggedAction = e.dataTransfer.getData('text/plain') as ShuntAction;
    if (draggedAction && draggedAction !== action) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, action as ShuntAction);
  };

  const [icon, text] = React.Children.toArray(children);

  return (
    <div className={`relative group/btn w-full ${className}`}>
        <button
        onClick={onClick}
        disabled={disabled}
        draggable={!disabled && action in ShuntAction}
        onDragStart={(e) => onDragStart(e, action as ShuntAction)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onTouchStart={onTouchStart ? (e) => onTouchStart(e, action as ShuntAction) : undefined}
        onTouchEnd={onTouchEnd ? (e) => onTouchEnd(e, action as ShuntAction) : undefined}
        onTouchCancel={onTouchCancel}
        title={tooltip}
        className={`
            aether-btn flex items-center gap-3 text-xs p-2.5 rounded-md w-full text-left pr-8
            ${isActive ? 'bg-blue-900/30 text-blue-200 border border-blue-800' : 'bg-gray-800 border border-gray-700/50 hover:border-gray-600'}
            ${isDragOver ? 'border-dashed border-blue-400 bg-blue-900/20' : ''}
        `}
        >
        <span className={`flex-shrink-0 ${isActive ? 'animate-pulse text-blue-400' : 'text-gray-400'}`}>
            {icon}
        </span>
        <span className="truncate flex-grow">{text}</span>
        {isActive && <Loader className="w-3 h-3 text-blue-400" />}
        </button>
        
        {/* Pin Button Overlay */}
        {onTogglePin && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-200 
                    ${isPinned ? 'text-yellow-400 opacity-100' : 'text-gray-600 opacity-0 group-hover/btn:opacity-100 hover:text-yellow-400 hover:bg-gray-700'}
                `}
                title={isPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
            >
                <StarIcon className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
            </button>
        )}
    </div>
  );
};

export default React.memo(ShuntButton);
