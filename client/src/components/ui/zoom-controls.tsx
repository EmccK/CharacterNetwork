import React from 'react';
import { Button } from './button';
import { Minus, Plus, Maximize, MoveHorizontal } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onPanMode?: () => void;
  scale?: number;
  minScale?: number;
  maxScale?: number;
  className?: string;
  vertical?: boolean;
  showPanButton?: boolean;
  isPanMode?: boolean;
  disableZoomIn?: boolean;
  disableZoomOut?: boolean;
}

/**
 * 通用缩放控制组件，用于控制图表的缩放和平移
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onPanMode,
  scale = 1,
  minScale = 0.1,
  maxScale = 3,
  className = '',
  vertical = false,
  showPanButton = false,
  isPanMode = false,
  disableZoomIn = false,
  disableZoomOut = false
}) => {
  // 计算是否可以缩放
  const canZoomIn = !disableZoomIn && (maxScale === undefined || scale < maxScale);
  const canZoomOut = !disableZoomOut && (minScale === undefined || scale > minScale);

  // 主容器类名
  const containerClassName = `
    flex ${vertical ? 'flex-col' : 'flex-row'} 
    gap-1 bg-background/90 backdrop-blur-sm 
    rounded-lg shadow-md border border-border/50 p-1
    ${className}
  `;

  // 控制按钮
  const controls = [
    {
      icon: <Plus className="h-4 w-4" />,
      tooltip: "放大",
      onClick: onZoomIn,
      disabled: !canZoomIn,
      show: true
    },
    {
      icon: <Minus className="h-4 w-4" />,
      tooltip: "缩小",
      onClick: onZoomOut,
      disabled: !canZoomOut,
      show: true
    },
    {
      icon: <Maximize className="h-4 w-4" />,
      tooltip: "重置视图",
      onClick: onReset,
      disabled: false,
      show: true
    },
    {
      icon: <MoveHorizontal className="h-4 w-4" />,
      tooltip: isPanMode ? "退出平移模式" : "平移模式",
      onClick: onPanMode,
      disabled: false,
      show: showPanButton && onPanMode !== undefined
    }
  ].filter(control => control.show);

  return (
    <div className={containerClassName}>
      {controls.map((control, index) => (
        <Tooltip key={index} delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={control.onClick}
              disabled={control.disabled}
              className={`h-8 w-8 rounded-md ${
                isPanMode && control.tooltip.includes("平移") 
                  ? "bg-primary/20 text-primary" 
                  : ""
              }`}
            >
              {control.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={vertical ? "right" : "top"}>
            <p>{control.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
