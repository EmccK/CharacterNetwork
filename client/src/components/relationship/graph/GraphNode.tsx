import React, { useRef } from 'react';
import type { GraphNode as GraphNodeType } from './types';

interface GraphNodeProps {
  node: GraphNodeType;
  transform: string; // We'll keep this for compatibility, but use node.x and node.y directly
  selected: boolean;
  onNodeClick: (id: number) => void;
  onNodeMouseDown: (event: React.MouseEvent, id: number) => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({ 
  node, 
  transform, 
  selected,
  onNodeClick,
  onNodeMouseDown
}) => {
  const nodeRadius = 12; // 增加节点大小，使其更易于选中
  const groupRef = useRef<SVGGElement>(null);
  
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return; // 只处理左键点击
    event.stopPropagation(); // 阻止事件冒泡
    onNodeMouseDown(event, node.id);
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    onNodeClick(node.id);
  };

  // 确保节点的x和y属性存在
  const x = node.x !== undefined ? node.x : 0;
  const y = node.y !== undefined ? node.y : 0;
  
  // 根据节点连接度对应的大小
  const sizeMultiplier = Math.min(1.5, 1 + (node.degree * 0.1));
  const finalRadius = nodeRadius * sizeMultiplier;

  return (
    <g 
      ref={groupRef}
      transform={`translate(${x},${y})`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className="cursor-move node-group"
      style={{ pointerEvents: 'all' }} // 确保元素可以接收鼠标事件
      data-id={String(node.id)} // 添加数据属性，确保是字符串类型
    >
      {/* 节点外圈 */}
      <circle
        r={finalRadius + 2}
        fill={selected ? "#EDF2F7" : "transparent"}
        className="transition-all duration-150"
      />
      
      {/* 节点主体 */}
      <circle
        r={finalRadius}
        fill={node.color}
        stroke={selected ? "#3B82F6" : "#FFFFFF"}
        strokeWidth={selected ? 2 : 1}
        className="transition-all duration-200 hover:stroke-blue-400"
      />

      {/* 显示节点头像（如果有） */}
      {node.avatar && (
        <clipPath id={`clip-${node.id}`}>
          <circle r={finalRadius - 1} cx="0" cy="0" />
        </clipPath>
      )}

      {/* 节点名称 */}
      <text
        className="text-xs font-medium fill-gray-700 pointer-events-none select-none drop-shadow-sm"
        textAnchor="middle"
        y={finalRadius + 12}
        style={{
          textShadow: '0 0 3px white, 0 0 2px white',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        {node.name}
      </text>
      
      {/* 透明的更大点击区域 */}
      <circle
        r={finalRadius + 14}
        fill="transparent"
        style={{ pointerEvents: 'all' }}
        className="cursor-move"
      />
    </g>
  );
};

export default GraphNode;
