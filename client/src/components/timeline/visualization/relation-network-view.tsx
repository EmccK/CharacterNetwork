import React, { useEffect, useRef, useState } from 'react';
import { TimelineEvent, Character, EventRelation } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';

interface RelationNetworkViewProps {
  events: TimelineEvent[];
  characters: Character[];
  eventRelations: EventRelation[];
}

const RelationNetworkView: React.FC<RelationNetworkViewProps> = ({
  events,
  characters,
  eventRelations
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<EventRelation | null>(null);

  // 构建网络图数据
  const networkData = React.useMemo(() => {
    if (!events.length) {
      return { nodes: [], links: [] };
    }

    // 为每个事件创建一个节点
    const nodes = events.map(event => {
      // 根据重要性确定节点大小和颜色
      let size, color;
      switch (event.importance) {
        case 'critical': 
          size = 20; 
          color = '#EF4444'; // 红色
          break;
        case 'important': 
          size = 16; 
          color = '#F59E0B'; // 橙色
          break;
        case 'normal': 
          size = 12; 
          color = '#3B82F6'; // 蓝色
          break;
        case 'minor': 
        default: 
          size = 8; 
          color = '#6B7280'; // 灰色
          break;
      }

      return {
        id: event.id,
        name: event.title,
        date: event.date,
        description: event.description,
        importance: event.importance,
        characterIds: event.characterIds,
        size,
        color,
        x: 0,
        y: 0
      };
    });

    // 创建连接
    const links = eventRelations.map(relation => {
      // 确定连接颜色和样式
      let color, dashArray, width;
      switch (relation.relationType) {
        case 'causes': 
          color = '#EF4444'; // 红色表示因果关系
          dashArray = 'none';
          width = 2;
          break;
        case 'follows': 
          color = '#3B82F6'; // 蓝色表示时间跟随关系
          dashArray = 'none';
          width = 1.5;
          break;
        case 'parallel': 
          color = '#8B5CF6'; // 紫色表示并行关系
          dashArray = '5,5'; // 虚线
          width = 1.5;
          break;
        default: 
          color = '#6B7280'; 
          dashArray = 'none';
          width = 1;
      }

      return {
        id: `${relation.sourceEventId}-${relation.targetEventId}`,
        source: relation.sourceEventId,
        target: relation.targetEventId,
        type: relation.relationType,
        description: relation.description,
        color,
        dashArray,
        width
      };
    });

    return { nodes, links };
  }, [events, eventRelations]);

  // 使用力导向布局安排节点
  useEffect(() => {
    if (!svgRef.current || !networkData.nodes.length) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = svg.clientHeight;

    // 这里应该使用D3.js的力导向布局
    // 在这个简化版本中，我们使用一个基本的环形布局
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // 环形布局
    networkData.nodes.forEach((node, i) => {
      const angle = (i / networkData.nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
    
  }, [networkData, zoom, pan]);

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

  // 找出与某个事件相关的所有关系
  const getRelatedLinks = (eventId: number) => {
    return networkData.links.filter(
      link => link.source === eventId || link.target === eventId
    );
  };

  // 如果没有事件，显示空状态
  if (events.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-gray-500">暂无事件数据，无法生成关系网络图。请添加时间线事件。</p>
      </div>
    );
  }

  // 如果有事件但没有关系
  if (events.length > 0 && eventRelations.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8">
        <div className="text-center mb-4">
          <p className="text-gray-500">暂无事件关联关系，无法生成关系网络图。请添加事件之间的关联关系。</p>
          <p className="text-sm text-gray-400 mt-2">事件总数：{events.length}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {events.map(event => (
            <div key={event.id} className="border rounded-md p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{event.title}</h4>
                <Badge 
                  className={`
                    ${event.importance === 'critical' ? 'bg-red-100 text-red-800' : ''}
                    ${event.importance === 'important' ? 'bg-amber-100 text-amber-800' : ''}
                    ${event.importance === 'normal' ? 'bg-blue-100 text-blue-800' : ''}
                    ${event.importance === 'minor' ? 'bg-gray-100 text-gray-800' : ''}
                  `}
                >
                  {event.importance}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">{event.date}</p>
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
        
        <div className="text-sm text-gray-500">
          {selectedEventId ? (
            <span>
              已选择: {events.find(e => e.id === selectedEventId)?.title || '事件'}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-6 px-2"
                onClick={() => setSelectedEventId(null)}
              >
                清除选择
              </Button>
            </span>
          ) : (
            <span>点击节点查看关联</span>
          )}
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
      
      {/* 网络图 SVG */}
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
            {networkData.links.map((link) => {
              const source = networkData.nodes.find(node => node.id === link.source);
              const target = networkData.nodes.find(node => node.id === link.target);
              
              if (!source || !target) return null;
              
              // 判断是否高亮显示此连接
              const isHighlighted = selectedEventId !== null && 
                (link.source === selectedEventId || link.target === selectedEventId);
              
              // 如果选择了一个节点，但此连接与该节点无关，则降低不透明度
              const opacity = selectedEventId === null || isHighlighted ? 1 : 0.2;
              
              return (
                <g key={link.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={link.color}
                    strokeWidth={link.width}
                    strokeDasharray={link.dashArray}
                    opacity={opacity}
                    onMouseEnter={() => {
                      const relation = eventRelations.find(
                        r => r.sourceEventId === link.source && r.targetEventId === link.target
                      );
                      if (relation) setHoveredRelation(relation);
                    }}
                    onMouseLeave={() => setHoveredRelation(null)}
                  />
                  
                  {/* 箭头 */}
                  {link.type !== 'parallel' && (
                    <polygon
                      points="0,-3 6,0 0,3"
                      fill={link.color}
                      opacity={opacity}
                      transform={`translate(${target.x},${target.y}) rotate(${Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI}) translate(-10,0)`}
                    />
                  )}
                  
                  {/* 关系标签（仅在高亮连接时显示） */}
                  {isHighlighted && link.description && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2}
                      dy="-5"
                      textAnchor="middle"
                      fontSize="10"
                      fill={link.color}
                      className="pointer-events-none"
                    >
                      {link.description}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* 绘制节点 */}
            <TooltipProvider>
              {networkData.nodes.map((node) => {
                // 如果选择了一个节点，但不是当前节点也不与当前节点有关联，则降低不透明度
                const isNodeHighlighted = selectedEventId === null || 
                  node.id === selectedEventId || 
                  networkData.links.some(
                    link => (link.source === selectedEventId && link.target === node.id) || 
                          (link.target === selectedEventId && link.source === node.id)
                  );
                
                const opacity = isNodeHighlighted ? 1 : 0.3;
                
                return (
                  <Tooltip key={node.id}>
                    <TooltipTrigger asChild>
                      <g
                        transform={`translate(${node.x},${node.y})`}
                        onClick={() => setSelectedEventId(node.id === selectedEventId ? null : node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r={node.size}
                          fill={node.color}
                          opacity={opacity}
                          strokeWidth={node.id === selectedEventId ? 3 : 1}
                          stroke={node.id === selectedEventId ? '#000' : '#fff'}
                        />
                        
                        <text
                          textAnchor="middle"
                          dy="-15"
                          fontSize="12"
                          fill="#333"
                          opacity={opacity}
                          className="pointer-events-none"
                        >
                          {node.name}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-0 overflow-hidden max-w-xs">
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
                          
                          {/* 显示关联关系数量 */}
                          {getRelatedLinks(node.id).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              关联关系: {getRelatedLinks(node.id).length}
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => setSelectedEventId(node.id)}
                              >
                                查看 <ArrowUpRight className="h-3 w-3 ml-0.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RelationNetworkView;
