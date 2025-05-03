import { useGraphStore } from '@/components/relationship/graph/graphStore';
import { useCallback, useRef } from 'react';

/**
 * 封装图形节点拖拽状态和操作的钩子
 */
export function useGraphDrag() {
  const { 
    dragging, 
    isDragging, 
    startNodeDrag, 
    updateNodePosition, 
    endNodeDrag,
    nodes
  } = useGraphStore();
  
  // 用于跟踪拖拽操作的引用
  const draggedNodeRef = useRef<number | null>(null);
  
  /**
   * 处理节点拖拽开始
   * @param event 鼠标事件
   * @param nodeId 节点ID
   * @param onDragStart 可选的拖拽开始回调函数
   */
  const handleNodeDragStart = useCallback((
    event: React.MouseEvent<SVGElement>, 
    nodeId: number,
    onDragStart?: () => void
  ) => {
    event.stopPropagation();
    
    // 记录被拖拽的节点
    draggedNodeRef.current = nodeId;
    startNodeDrag(nodeId);
    
    if (onDragStart) {
      onDragStart();
    }
  }, [startNodeDrag]);
  
  /**
   * 处理节点拖拽移动
   * @param event 鼠标事件
   * @param svgRef SVG元素的引用
   * @param transform 当前变换状态
   */
  const handleNodeDragMove = useCallback((
    event: MouseEvent,
    svgRef: SVGSVGElement | null,
    transform: { x: number; y: number; scale: number }
  ) => {
    if (!draggedNodeRef.current || !svgRef || !isDragging) return;
    
    // 计算拖拽位置
    const rect = svgRef.getBoundingClientRect();
    const scale = transform.scale;
    const x = (event.clientX - rect.left - transform.x) / scale;
    const y = (event.clientY - rect.top - transform.y) / scale;
    
    // 更新节点位置
    updateNodePosition(draggedNodeRef.current, x, y);
  }, [isDragging, updateNodePosition]);
  
  /**
   * 处理节点拖拽结束
   * @param onDragEnd 可选的拖拽结束回调函数
   */
  const handleNodeDragEnd = useCallback((onDragEnd?: () => void) => {
    if (draggedNodeRef.current) {
      endNodeDrag(draggedNodeRef.current);
      draggedNodeRef.current = null;
      
      if (onDragEnd) {
        onDragEnd();
      }
    }
  }, [endNodeDrag]);
  
  /**
   * 获取节点当前位置
   * @param nodeId 节点ID
   */
  const getNodePosition = useCallback((nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : null;
  }, [nodes]);
  
  return {
    dragging,
    isDragging,
    draggedNodeRef,
    handleNodeDragStart,
    handleNodeDragMove,
    handleNodeDragEnd,
    getNodePosition
  };
}
