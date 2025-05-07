import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TimelineEvent, Character } from '@/types/timeline';

interface GanttViewProps {
  events: TimelineEvent[];
  characters: Character[];
}

// 甘特图视图组件
const GanttView: React.FC<GanttViewProps> = ({ events, characters }) => {
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  
  // 处理日期转换和时间范围计算
  const {
    eventBlocks,
    timeLabels,
    minDate,
    maxDate,
    timeRange
  } = useMemo(() => {
    // 确保事件数组不为空
    if (events.length === 0) {
      return { 
        eventBlocks: [], 
        timeLabels: [], 
        minDate: new Date(), 
        maxDate: new Date(), 
        timeRange: 1 
      };
    }

    // 解析日期并找出最小和最大日期
    // 这里我们假设日期格式已经一致，作为简化处理
    // 实际应用中可能需要更复杂的日期解析和标准化
    const parsedDates = events.map(event => {
      // 这里简单处理，如果需要复杂处理可以扩展
      try {
        return { id: event.id, date: new Date(event.date) };
      } catch (e) {
        // 对于无法解析的日期，使用一个占位日期
        return { id: event.id, date: new Date(0) };
      }
    });
    
    const validDates = parsedDates.filter(d => !isNaN(d.date.getTime()));
    
    if (validDates.length === 0) {
      return { 
        eventBlocks: [], 
        timeLabels: [], 
        minDate: new Date(), 
        maxDate: new Date(), 
        timeRange: 1 
      };
    }
    
    const minDate = new Date(Math.min(...validDates.map(d => d.date.getTime())));
    const maxDate = new Date(Math.max(...validDates.map(d => d.date.getTime())));
    
    // 确保时间范围至少有一天
    const timeRange = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 创建时间轴标签
    const timeLabels = [];
    const labelCount = Math.min(10, timeRange); // 限制标签数量，避免过密
    const step = timeRange / labelCount;
    
    for (let i = 0; i <= labelCount; i++) {
      const date = new Date(minDate.getTime() + i * step * 24 * 60 * 60 * 1000);
      timeLabels.push(date.toLocaleDateString());
    }
    
    // 创建事件块数据
    const eventBlocks = events.map(event => {
      const eventDate = parsedDates.find(d => d.id === event.id)?.date || minDate;
      const position = (eventDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime()) * 100;
      
      // 根据重要性确定块的高度
      let height;
      switch (event.importance) {
        case 'critical': height = 40; break;
        case 'important': height = 32; break;
        case 'normal': height = 24; break;
        case 'minor': default: height = 16; break;
      }
      
      // 根据重要性计算颜色
      let color;
      switch (event.importance) {
        case 'critical': color = 'bg-red-500'; break;
        case 'important': color = 'bg-amber-500'; break;
        case 'normal': color = 'bg-blue-500'; break;
        case 'minor': default: color = 'bg-gray-500'; break;
      }
      
      return {
        ...event,
        position: Math.max(0, Math.min(100, position)), // 确保在0-100范围内
        height,
        color
      };
    });
    
    return { eventBlocks, timeLabels, minDate, maxDate, timeRange };
  }, [events]);
  
  // 如果没有事件，显示空状态
  if (events.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-gray-500">暂无事件数据，无法生成甘特图。请添加时间线事件。</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border rounded-lg p-4">
      <TooltipProvider>
        <div className="relative pb-10">
          {/* 时间轴 */}
          <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-gray-200">
            {timeLabels.map((label, index) => (
              <div 
                key={index} 
                className="absolute text-xs text-gray-600" 
                style={{ 
                  left: `${(index / (timeLabels.length - 1)) * 100}%`, 
                  bottom: 0,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="h-2 w-0.5 bg-gray-200 mx-auto mb-1"></div>
                <div>{label}</div>
              </div>
            ))}
          </div>
          
          {/* 甘特图内容区域 */}
          <div className="relative h-[400px] mb-4">
            {/* 绘制水平网格线 */}
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="absolute w-full h-px bg-gray-100" 
                style={{ top: `${i * 25}%` }}
              ></div>
            ))}
            
            {/* 事件块 */}
            {eventBlocks.map((block, index) => {
              const isHovered = hoveredEventId === block.id;
              const eventChars = characters.filter(char => 
                block.characterIds && block.characterIds.includes(char.id)
              );
              
              return (
                <Tooltip key={block.id}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`absolute rounded-md cursor-pointer transition-all ${block.color} ${isHovered ? 'ring-2 ring-primary z-10' : ''}`}
                      style={{ 
                        left: `${block.position}%`, 
                        top: `${index * 50}px`,
                        transform: 'translateX(-50%)',
                        height: `${block.height}px`,
                        width: '12px'
                      }}
                      onMouseEnter={() => setHoveredEventId(block.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="p-0 overflow-hidden rounded-md shadow-md">
                    <div className="max-w-xs bg-white rounded-md">
                      <div className={`${block.color.replace('bg-', 'bg-')} text-white p-2`}>
                        <div className="font-medium">{block.title}</div>
                        <div className="text-xs opacity-90">{block.date}</div>
                      </div>
                      <div className="p-3 text-sm">
                        {block.description ? (
                          <p className="text-gray-700 mb-2">{block.description}</p>
                        ) : (
                          <p className="text-gray-500 italic mb-2">暂无描述</p>
                        )}
                        
                        {eventChars.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">相关角色：</h4>
                            <div className="flex flex-wrap gap-1">
                              {eventChars.map(char => (
                                <Badge key={char.id} variant="secondary" className="text-xs">
                                  {char.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default GanttView;
