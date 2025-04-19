import React from 'react';
import type { GraphNode, GraphLink as GraphLinkType } from './types';

interface GraphLinkProps {
  link: GraphLinkType;
  nodesMap: Map<number, GraphNode>;
  selectedNode?: number | null;
}

const GraphLink: React.FC<GraphLinkProps> = ({ link, nodesMap, selectedNode }) => {
  // 将source和target转换为数字类型
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  
  // 从nodesMap获取源节点和目标节点
  const source = nodesMap.get(sourceId);
  const target = nodesMap.get(targetId);
  
  // 如果节点不存在或者位置未定义，则不渲染线条
  if (!source || !target || source.x === undefined || source.y === undefined || 
      target.x === undefined || target.y === undefined) {
    return null;
  }

  // 检查是否为选中节点的连接线
  const isSelectedLink = selectedNode !== null && selectedNode !== undefined && 
    (sourceId === selectedNode || targetId === selectedNode);

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={link.color || "#CBD5E0"}
      strokeWidth={isSelectedLink ? 2 : 1.5}
      strokeOpacity={isSelectedLink ? 1 : 0.7}
      className="transition-all duration-300 hover:stroke-opacity-100 hover:stroke-[2px]"
    />
  );
};

export default GraphLink;
