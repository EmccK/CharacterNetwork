import React, { useState, useRef, useEffect } from 'react';
import { Card } from './card';

interface GraphContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  height?: string | number;
  fullWidth?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
  controls?: React.ReactNode;
}

/**
 * 通用图表容器组件，用于包装各种图表
 */
export const GraphContainer: React.FC<GraphContainerProps> = ({
  children,
  className = '',
  title,
  description,
  height = '500px',
  fullWidth = true,
  isLoading = false,
  emptyMessage = '没有数据可显示',
  isEmpty = false,
  controls
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // 计算容器样式
  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: fullWidth ? '100%' : 'auto'
  };

  // 渲染加载状态
  const renderLoading = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  // 渲染空状态
  const renderEmpty = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
      <div className="bg-muted rounded-full p-4 mb-4">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-1">{emptyMessage}</h3>
    </div>
  );

  return (
    <Card 
      className={`overflow-hidden ${className}`}
      ref={containerRef}
    >
      {/* 标题和控制区 */}
      {(title || controls) && (
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {controls && (
            <div className="flex items-center space-x-2">
              {controls}
            </div>
          )}
        </div>
      )}

      {/* 图表内容区 */}
      <div 
        className="relative"
        style={containerStyle}
      >
        {isLoading && renderLoading()}
        {isEmpty && !isLoading && renderEmpty()}
        {!isEmpty && (
          <div className="h-full w-full">
            {children}
          </div>
        )}
      </div>
    </Card>
  );
};
