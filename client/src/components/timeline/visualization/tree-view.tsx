import React, { useEffect, useRef, useState } from 'react';
import { TimelineEvent, Character, EventRelation } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronsUpDown, 
  MoveHorizontal,
  RefreshCw
} from 'lucide-react';

interface TreeViewProps {
  events: TimelineEvent[];
  eventRelations: EventRelation[];
  characters: Character[];
}

const TreeView: React.FC<TreeViewProps> = ({
  events,
  eventRelations,
  characters
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewType, setViewType] = useState<'vertical' | 'horizontal'>('vertical');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // 构建树状图数据结构
  const treeData = React.useMemo(() => {
    if (!events.length) {
      return { nodes: [], links: [] };
    }

    // 创建节点
    const nodes = events.map(event => {
      // 确定节点颜色
      let color;
      switch (event.importance) {
        case 'critical': color = '#EF4444'; break; // 红色
        case 'important': color = '#F59E0B'; break; // 橙色
        case 'normal': color = '#3B82F6'; break; // 蓝色
        case 'minor': default: color = '#6B7280'; break; // 灰色
      }

      return {
        id: event.id,
        name: event.title,
        date: event.date,
        importance: event.importance,
        description: event.description,
        characterIds: event.characterIds,
        color,
        x: 0,
        y: 0
      };
    });

    // 创建连接
    const links = eventRelations.map(relation => {
      // 确定连接颜色和样式
      let color, dashArray;
      switch (relation.relationType) {
        case 'causes': 
          color = '#EF4444'; // 红色表示因果关系
          dashArray = 'none';
          break;
        case 'follows': 
          color = '#3B82F6'; // 蓝色表示时间跟随关系
          dashArray = 'none';
          break;
        case 'parallel': 
          color = '#8B5CF6'; // 紫色表示并行关系
          dashArray = '5,5'; // 虚线
          break;
        default: 
          color = '#6B7280'; 
          dashArray = 'none';
      }

      return {
        source: relation.sourceEventId,
        target: relation.targetEventId,
        type: relation.relationType,
        description: relation.description,
        color,
        dashArray
      };
    });

    return { nodes, links };
  }, [events, eventRelations]);

  // 当没有关系数据时显示所有事件为单独节点
  const hasRelations = eventRelations.length > 0;
  
  // 计算树形布局
  useEffect(() => {
    if (!svgRef.current || !treeData.nodes.length) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    
    // 这里应该使用D3.js库来计算和渲染树形布局
    // 但在这个简化版本中，我们使用简单的分层布局
    
    // 简单地在垂直或水平方向上布局节点
    if (viewType === 'vertical') {
      // 垂直布局：按日期从上到下排列
      const sortedEvents = [...treeData.nodes].sort((a, b) => a.date.localeCompare(b.date));
      const rowHeight = Math.min(80, height / sortedEvents.length);
      
      sortedEvents.forEach((node, index) => {
        node.x = width / 2;
        node.y = 50 + index * rowHeight;
      });
    } else {
      // 水平布局：按日期从左到右排列
      const sortedEvents = [...treeData.nodes].sort((a, b) => a.date.localeCompare(b.date));
      const columnWidth = Math.min(200, width / sortedEvents.length);
      
      sortedEvents.forEach((node, index) => {
        node.x = 80 + index * columnWidth;
        node.y = height / 2;
      });
    }
    
  }, [treeData, viewType, zoom, pan]);

  // 处理拖动
  const startDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const onDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setZoom(Math.min(2, zoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.5, zoom - 0.1));
  };

  // 重置视图
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // 切换视图类型
  const toggleViewType = () => {
    setViewType(viewType === 'vertical' ? 'horizontal' : 'vertical');
  };

  // 如果没有事件，显示空状态
  if (events.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-gray-500">暂无事件数据，无法生成树状图。请添加时间线事件和事件关联关系。</p>
      </div>
    );
  }

  // 如果有事件但没有关系数据
  if (events.length > 0 && eventRelations.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8">
        <div className="text-center mb-4">
          <p className="text-gray-500">暂无事件关联关系，无法生成完整树状图。请添加事件之间的关联关系。</p>
          <p className="text-sm text-gray-400 mt-2">以下是当前的时间线事件列表：</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {events.map(event => (
            <div key={event.id} className="border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium">{event.title}</h4>
              <p className="text-sm text-gray-500">{event.date}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      {/* 控制按钮 */}
      <div className="flex flex-wrap justify-between items-center mb-2">
        <div className="space-x-1">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleViewType}
            className="ml-1"
          >
            {viewType === 'vertical' ? (
              <ChevronsUpDown className="h-4 w-4 mr-1" />
            ) : (
              <MoveHorizontal className="h-4 w-4 mr-1" />
            )}
            {viewType === 'vertical' ? '垂直布局' : '水平布局'}
          </Button>
        </div>
      </div>
      
      {/* 图例 */}
      <div className="mb-4 border-t border-b py-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
          <span>关键事件</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
          <span>重要事件</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
          <span>普通事件</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-1"></span>
          <span>次要事件</span>
        </div>
        
        <div className="flex items-center ml-4">
          <svg className="w-8 h-3 mr-1">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#EF4444" strokeWidth="2" />
          </svg>
          <span>因果关系</span>
        </div>
        <div className="flex items-center">
          <svg className="w-8 h-3 mr-1">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#3B82F6" strokeWidth="2" />
          </svg>
          <span>跟随关系</span>
        </div>
        <div className="flex items-center">
          <svg className="w-8 h-3 mr-1">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
          <span>并行关系</span>
        </div>
      </div>
      
      {/* 树形视图 SVG */}
      <div className="border bg-gray-50 rounded-md" style={{ height: '500px', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* 绘制连接 */}
            {hasRelations && treeData.links.map((link, index) => {
              const source = treeData.nodes.find(node => node.id === link.source);
              const target = treeData.nodes.find(node => node.id === link.target);
              
              if (!source || !target) return null;
              
              // 为垂直和水平布局选择不同的路径
              let path;
              if (viewType === 'vertical') {
                // 垂直布局的连接路径
                path = `M${source.x},${source.y} C${source.x},${(source.y + target.y) / 2} ${target.x},${(source.y + target.y) / 2} ${target.x},${target.y}`;
              } else {
                // 水平布局的连接路径
                path = `M${source.x},${source.y} C${(source.x + target.x) / 2},${source.y} ${(source.x + target.x) / 2},${target.y} ${target.x},${target.y}`;
              }
              
              return (
                <path
                  key={`link-${index}`}
                  d={path}
                  fill="none"
                  stroke={link.color}
                  strokeWidth="2"
                  strokeDasharray={link.dashArray}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            
            {/* 箭头标记 */}
            <defs>
              <marker
                id="arrowhead"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
              </marker>
            </defs>
            
            {/* 绘制节点 */}
            <TooltipProvider>
              {treeData.nodes.map(node => (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${node.x},${node.y})`}
                  onClick={() => setSelectedEventId(node.id === selectedEventId ? null : node.id)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <circle
                        r="10"
                        fill={node.color}
                        stroke={node.id === selectedEventId ? "#000" : "#fff"}
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="p-0 overflow-hidden max-w-xs">
                      <div className="bg-white rounded-md shadow-lg">
                        <div style={{ backgroundColor: node.color }} className="text-white p-3">
                          <h3 className="font-medium mb-1">{node.name}</h3>
                          <p className="text-sm opacity-90">{node.date}</p>
                        </div>
                        <div className="p-3">
                          {node.description ? (
                            <p className="text-sm text-gray-700 mb-2">{node.description}</p>
                          ) : (
                            <p className="text-sm text-gray-500 italic mb-2">暂无描述</p>
                          )}
                          
                          {/* 显示相关角色 */}
                          {node.characterIds && node.characterIds.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-1">相关角色：</h4>
                              <div className="flex flex-wrap gap-1">
                                {node.characterIds.map(charId => {
                                  const character = characters.find(c => c.id === charId);
                                  return character ? (
                                    <Badge key={charId} variant="secondary" className="text-xs">
                                      {character.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* 节点标签 */}
                  <text
                    dy={viewType === 'vertical' ? -15 : 0}
                    dx={viewType === 'vertical' ? 0 : 15}
                    textAnchor={viewType === 'vertical' ? 'middle' : 'start'}
                    fontSize="12"
                    fill="#333"
                  >
                    {node.name}
                  </text>
                </g>
              ))}
            </TooltipProvider>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default TreeView;
