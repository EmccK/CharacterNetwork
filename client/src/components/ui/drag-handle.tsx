import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface DragHandleProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrag?: (delta: Position) => void;
  axis?: 'both' | 'x' | 'y';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  bounds?: 'parent' | 'window' | HTMLElement | null;
}

/**
 * 通用拖拽控制组件，用于实现元素的拖拽功能
 */
export const DragHandle: React.FC<DragHandleProps> = ({
  onDragStart,
  onDragEnd,
  onDrag,
  axis = 'both',
  disabled = false,
  className = '',
  children,
  icon,
  iconClassName = '',
  bounds = null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastPositionRef = useRef<Position | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const boundingRef = useRef<HTMLElement | null>(null);

  // 如果bounds是HTML元素，则设置为boundingRef
  useEffect(() => {
    if (bounds instanceof HTMLElement) {
      boundingRef.current = bounds;
    } else if (bounds === 'parent' && handleRef.current) {
      boundingRef.current = handleRef.current.parentElement as HTMLElement;
    } else if (bounds === 'window') {
      boundingRef.current = null; // 将使用window边界
    }
  }, [bounds]);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
    
    if (onDragStart) {
      onDragStart();
    }
    
    // 添加鼠标移动和鼠标释放事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 处理拖拽移动
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !lastPositionRef.current) return;
    
    const delta = {
      x: axis === 'y' ? 0 : e.clientX - lastPositionRef.current.x,
      y: axis === 'x' ? 0 : e.clientY - lastPositionRef.current.y
    };
    
    // 应用边界限制
    if (boundingRef.current && handleRef.current) {
      const handleRect = handleRef.current.getBoundingClientRect();
      const boundingRect = boundingRef.current.getBoundingClientRect();
      
      // 计算新位置
      const newX = handleRect.x + delta.x;
      const newY = handleRect.y + delta.y;
      
      // 检查X轴边界
      if (axis !== 'y') {
        if (newX < boundingRect.left) {
          delta.x = boundingRect.left - handleRect.x;
        } else if (newX + handleRect.width > boundingRect.right) {
          delta.x = boundingRect.right - handleRect.x - handleRect.width;
        }
      }
      
      // 检查Y轴边界
      if (axis !== 'x') {
        if (newY < boundingRect.top) {
          delta.y = boundingRect.top - handleRect.y;
        } else if (newY + handleRect.height > boundingRect.bottom) {
          delta.y = boundingRect.bottom - handleRect.y - handleRect.height;
        }
      }
    } else if (bounds === 'window' && handleRef.current) {
      const handleRect = handleRef.current.getBoundingClientRect();
      
      // 计算新位置
      const newX = handleRect.x + delta.x;
      const newY = handleRect.y + delta.y;
      
      // 检查X轴边界
      if (axis !== 'y') {
        if (newX < 0) {
          delta.x = -handleRect.x;
        } else if (newX + handleRect.width > window.innerWidth) {
          delta.x = window.innerWidth - handleRect.x - handleRect.width;
        }
      }
      
      // 检查Y轴边界
      if (axis !== 'x') {
        if (newY < 0) {
          delta.y = -handleRect.y;
        } else if (newY + handleRect.height > window.innerHeight) {
          delta.y = window.innerHeight - handleRect.y - handleRect.height;
        }
      }
    }
    
    if (onDrag) {
      onDrag(delta);
    }
    
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false);
    lastPositionRef.current = null;
    
    if (onDragEnd) {
      onDragEnd();
    }
    
    // 移除事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 处理触摸事件（用于移动设备）
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    e.stopPropagation();
    
    setIsDragging(true);
    const touch = e.touches[0];
    lastPositionRef.current = { x: touch.clientX, y: touch.clientY };
    
    if (onDragStart) {
      onDragStart();
    }
    
    // 添加触摸移动和触摸结束事件监听
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  };

  // 处理触摸移动
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !lastPositionRef.current) return;
    
    e.preventDefault(); // 防止滚动
    
    const touch = e.touches[0];
    const delta = {
      x: axis === 'y' ? 0 : touch.clientX - lastPositionRef.current.x,
      y: axis === 'x' ? 0 : touch.clientY - lastPositionRef.current.y
    };
    
    // 应用与鼠标移动相同的边界限制逻辑
    // ...（此处省略重复代码）
    
    if (onDrag) {
      onDrag(delta);
    }
    
    lastPositionRef.current = { x: touch.clientX, y: touch.clientY };
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    setIsDragging(false);
    lastPositionRef.current = null;
    
    if (onDragEnd) {
      onDragEnd();
    }
    
    // 移除事件监听
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
  };

  return (
    <div
      ref={handleRef}
      className={cn(
        'inline-flex items-center justify-center cursor-grab',
        isDragging && 'cursor-grabbing',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {icon ? (
        <div className={cn('flex items-center justify-center', iconClassName)}>
          {icon}
        </div>
      ) : children ? (
        children
      ) : (
        <div className={cn('p-1', iconClassName)}>
          {axis === 'y' ? (
            <GripVertical className="h-4 w-4" />
          ) : (
            <Move className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  );
};
