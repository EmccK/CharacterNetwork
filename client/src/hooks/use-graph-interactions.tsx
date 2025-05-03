import { useState, useRef, useCallback, useEffect } from 'react';
import { useGraphStore } from '@/components/relationship/graph/graphStore';

interface UseGraphInteractionsProps {
  svgRef: React.RefObject<SVGSVGElement>;
  updateNodePosition?: (nodeId: number, x: number, y: number) => void;
  releaseNode?: (nodeId: number) => void;
  startSimulation?: (alpha?: number) => void;
  stopSimulation?: () => void;
  onNodeSelect?: (nodeId: number | null) => void;
}

export function useGraphInteractions({
  svgRef,
  updateNodePosition,
  releaseNode,
  startSimulation,
  stopSimulation,
  onNodeSelect
}: UseGraphInteractionsProps) {
  const { selectedNode, setSelectedNode } = useGraphStore();
  
  // 状态
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [activelyDragging, setActivelyDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'default' | 'pan' | 'zoom'>('default');
  
  // 引用值
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);
  const touchDistanceRef = useRef<number | null>(null);

  // 重置并居中视图
  const resetAndCenterView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // 处理背景点击
  const handleBackgroundClick = useCallback(() => {
    if (onNodeSelect) {
      onNodeSelect(null);
    } else {
      setSelectedNode(null);
    }
  }, [onNodeSelect, setSelectedNode]);

  // 处理节点点击
  const handleNodeClick = useCallback((id: number) => {
    if (onNodeSelect) {
      onNodeSelect(id);
    } else {
      setSelectedNode(id);
    }
  }, [onNodeSelect, setSelectedNode]);

  // 处理节点鼠标按下
  const handleNodeMouseDown = useCallback((event: React.MouseEvent, id: number) => {
    if (event.button !== 0) return; // 只处理左键点击
    
    event.stopPropagation();
    setDragging(id);
    isDraggingRef.current = true;
    draggedNodeRef.current = id;
    
    // 当开始拖动时启动模拟
    if (startSimulation) {
      startSimulation(0.3);
    }
  }, [startSimulation]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    // 平移图象
    if (activelyDragging && !dragging) {
      const dx = event.clientX - lastMousePos.x;
      const dy = event.clientY - lastMousePos.y;
      
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastMousePos({
        x: event.clientX,
        y: event.clientY
      });
      
      return;
    }
    
    // 处理节点拖拽
    if (!dragging || !svgRef.current || !isDraggingRef.current || !updateNodePosition) return;
    
    // 计算拖拽位置
    const rect = svgRef.current.getBoundingClientRect();
    const scale = transform.scale;
    const x = (event.clientX - rect.left - transform.x) / scale;
    const y = (event.clientY - rect.top - transform.y) / scale;
    
    // 更新节点位置
    updateNodePosition(dragging, x, y);
  }, [activelyDragging, dragging, lastMousePos, svgRef, transform, updateNodePosition]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    // 停止平移拖拽
    if (activelyDragging) {
      setActivelyDragging(false);
      // 恢复鼠标样式
      if (svgRef.current) {
        svgRef.current.style.cursor = isPanning ? 'grab' : 'default';
      }
    }

    // 处理节点拖拽结束
    if (dragging && isDraggingRef.current && releaseNode) {
      // 释放节点
      releaseNode(dragging);
      
      // 重置拖拽状态
      setDragging(null);
      isDraggingRef.current = false;
      draggedNodeRef.current = null;
      
      // 停止模拟
      if (stopSimulation) {
        stopSimulation();
      }
    }
  }, [activelyDragging, dragging, isPanning, releaseNode, stopSimulation, svgRef]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape取消选择节点
      if (e.key === 'Escape') {
        if (onNodeSelect) {
          onNodeSelect(null);
        } else {
          setSelectedNode(null);
        }
      }

      // Space键按下 - 启用平移模式
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setIsPanning(true);
        // 当空格键按下时，更改鼠标样式为可拖动
        if (svgRef.current) {
          svgRef.current.style.cursor = 'grab';
        }
      }

      // 加号键放大
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setTransform(prev => ({
          ...prev,
          scale: Math.min(3, prev.scale * 1.2)
        }));
      }

      // 减号键缩小
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setTransform(prev => ({
          ...prev,
          scale: Math.max(0.1, prev.scale / 1.2)
        }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Space键松开 - 禁用平移
      if (e.key === ' ') {
        e.preventDefault();
        setIsPanning(false);
        // 当空格键松开时，恢复鼠标样式
        if (svgRef.current) {
          svgRef.current.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onNodeSelect, setSelectedNode, svgRef]);

  // 处理滚轮缩放
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    
    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.shiftKey) {
        // 按住Shift时平移
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      } else {
        // 普通滚轮缩放
        const zoomSensitivity = 0.002;
        const zoom = Math.abs(e.deltaY) * zoomSensitivity;
        const scaleFactor = e.deltaY > 0 ? (1 - zoom) : (1 + zoom);
        const newScale = Math.max(0.1, Math.min(3, transform.scale * scaleFactor));
        
        const rect = svgElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
        
        setTransform({
          x: newX,
          y: newY,
          scale: newScale
        });
      }
    };
    
    // 添加非被动式事件监听器
    svgElement.addEventListener('wheel', wheelListener, { passive: false });
    
    return () => {
      svgElement.removeEventListener('wheel', wheelListener);
    };
  }, [transform, svgRef]);

  // 计算两个触摸点之间的距离
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理触摸开始事件
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // 单指触摸 - 记录起始位置和时间
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      
      // 检查是否触摸到了节点
      if (draggedNodeRef.current === null) {
        // 没有拖动节点时默认为平移模式
        if (interactionMode === 'default' || interactionMode === 'pan') {
          setActivelyDragging(true);
        }
      }
    } else if (event.touches.length === 2) {
      // 双指触摸 - 用于缩放
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      touchDistanceRef.current = getTouchDistance(touch1, touch2);
      
      // 在缩放模式下
      if (interactionMode === 'default' || interactionMode === 'zoom') {
        setActivelyDragging(false);
      }
    }
  }, [interactionMode]);

  // 处理触摸移动事件
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // 单指移动 - 用于平移或拖动节点
      const touch = event.touches[0];
      
      if (draggedNodeRef.current !== null && isDraggingRef.current && updateNodePosition) {
        // 拖动节点
        if (!svgRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const scale = transform.scale;
        const x = (touch.clientX - rect.left - transform.x) / scale;
        const y = (touch.clientY - rect.top - transform.y) / scale;
        
        // 更新节点位置
        updateNodePosition(draggedNodeRef.current, x, y);
      } else if (lastTouchRef.current && (interactionMode === 'default' || interactionMode === 'pan')) {
        // 平移视图
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        
        setTransform(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy
        }));
      }
      
      // 更新最后触摸位置
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (event.touches.length === 2 && touchDistanceRef.current !== null) {
      // 双指移动 - 用于缩放
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const newDistance = getTouchDistance(touch1, touch2);
      
      if (interactionMode === 'default' || interactionMode === 'zoom') {
        // 计算缩放比例
        const scaleFactor = newDistance / touchDistanceRef.current;
        const newScale = Math.max(0.1, Math.min(3, transform.scale * scaleFactor));
        
        // 计算缩放中心点
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;
          
          const mouseX = centerX - rect.left;
          const mouseY = centerY - rect.top;
          
          const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
          const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
          
          setTransform({
            x: newX,
            y: newY,
            scale: newScale
          });
        }
      }
      
      // 更新触摸距离
      touchDistanceRef.current = newDistance;
    }
  }, [interactionMode, transform, svgRef, updateNodePosition]);

  // 处理触摸结束事件
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    // 处理单指点击
    if (touchStartRef.current && lastTouchRef.current && event.touches.length === 0) {
      const touchEnd = {
        x: lastTouchRef.current.x,
        y: lastTouchRef.current.y,
        time: Date.now(),
      };
      
      // 检测是否为点击（移动距离小且时间短）
      const dx = touchEnd.x - touchStartRef.current.x;
      const dy = touchEnd.y - touchStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = touchEnd.time - touchStartRef.current.time;
      
      if (distance < 10 && duration < 300) {
        // 这是一个点击，但我们需要检查是否点击了节点
        if (draggedNodeRef.current === null) {
          // 点击了背景，取消节点选择
          if (onNodeSelect) {
            onNodeSelect(null);
          } else {
            setSelectedNode(null);
          }
        }
      }
    }
    
    // 结束拖动状态
    if (draggedNodeRef.current !== null && isDraggingRef.current && releaseNode) {
      // 释放节点
      releaseNode(draggedNodeRef.current);
      
      // 重置拖拽状态
      setDragging(null);
      isDraggingRef.current = false;
      draggedNodeRef.current = null;
      
      // 停止模拟
      if (stopSimulation) {
        stopSimulation();
      }
    }
    
    // 重置触摸状态
    setActivelyDragging(false);
    touchStartRef.current = null;
    lastTouchRef.current = null;
    touchDistanceRef.current = null;
  }, [onNodeSelect, releaseNode, setSelectedNode, stopSimulation]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // 在背景上按下鼠标左键
    if (event.button === 0) {
      // 如果是直接在背景上点击（而不是在节点上）
      const isBackgroundClick = (event.target as SVGElement).tagName === 'svg';
      
      if (isBackgroundClick) {
        event.preventDefault();
        setDragging(null); // 确保我们不是在拖动节点
        setActivelyDragging(true);
        setLastMousePos({
          x: event.clientX,
          y: event.clientY
        });
        
        // 当在背景上按下鼠标左键时，将鼠标更改为"拖动中"样式
        if (svgRef.current) {
          svgRef.current.style.cursor = 'grabbing';
        }
      }
    }
    
    // 中键用于平移或空格键按下时的左键
    if (event.button === 1 || (event.button === 0 && isPanning)) {
      event.preventDefault();
      setDragging(null); // 确保我们不是在拖动节点
      setActivelyDragging(true);
      setLastMousePos({
        x: event.clientX,
        y: event.clientY
      });
      
      // 当用户按下鼠标左键并处于拖动模式时，将鼠标更改为"拖动中"样式
      if (event.button === 0 && isPanning && svgRef.current) {
        svgRef.current.style.cursor = 'grabbing';
      }
    }
  }, [isPanning, svgRef]);

  // 设置互动模式
  const setMode = useCallback((mode: 'default' | 'pan' | 'zoom') => {
    setInteractionMode(mode === interactionMode ? 'default' : mode);
  }, [interactionMode]);

  return {
    transform,
    dragging,
    isPanning,
    activelyDragging,
    interactionMode,
    resetAndCenterView,
    handleBackgroundClick,
    handleNodeClick,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    setMode
  };
}