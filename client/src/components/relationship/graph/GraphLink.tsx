import React from 'react';
import type { GraphNode, GraphLink as GraphLinkType } from './types';

interface GraphLinkProps {
  link: GraphLinkType;
  nodesMap: Map<number, GraphNode>;
  selectedNode?: number | null;
}

const GraphLink: React.FC<GraphLinkProps> = ({ link, nodesMap, selectedNode }) => {
  // source和target可能是数字ID或者对象引用（D3.js会自动转换）
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  const targetId = typeof link.target === 'object' ? link.target.id : link.target;

  // 从nodesMap获取源节点和目标节点
  const source = nodesMap.get(sourceId);
  const target = nodesMap.get(targetId);


  // 如果节点不存在，则不渲染线条
  if (!source || !target) {
    return null;
  }

  // 如果节点位置未定义，使用默认位置
  const sourceX = source.x ?? 0;
  const sourceY = source.y ?? 0;
  const targetX = target.x ?? 0;
  const targetY = target.y ?? 0;

  // 检查是否为选中节点的连接线
  const isSelectedLink = selectedNode !== null && selectedNode !== undefined && 
    (sourceId === selectedNode || targetId === selectedNode);


  return (
    <line
      x1={sourceX}
      y1={sourceY}
      x2={targetX}
      y2={targetY}
      stroke={link.color || "#64748B"}
      strokeWidth={isSelectedLink ? 3 : 2}
      strokeOpacity={isSelectedLink ? 1 : 0.9}
      className="transition-all duration-300 hover:stroke-opacity-100"
      style={{ pointerEvents: 'auto' }}
    />
  );
};

export default GraphLink;
