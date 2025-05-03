import { useGraphStore } from '@/components/relationship/graph/graphStore';
import { useCallback, useRef, useEffect } from 'react';

/**
 * 封装图形交互模式和操作的钩子
 */
export function useGraphInteraction() {
  const { 
    isPanning, 
    activelyDragging, 
    lastMousePos, 
    interactionMode,
    startPanning, 
    stopPanning, 
    updatePanPosition, 
    setMousePosition,
    setInteractionMode,
    setSelectedNode,
    selectedNode,
    isFullscreen,
    toggleFullscreen,
    setFullscreen
  } = useGraphStore();
  
  // 引用值，用于追踪触摸状态
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);
  const touchDistanceRef = useRef<number | null>(null);
  
  /**
   * 设置交互模式
   * @param mode 交互模式
   */
  const setMode = useCallback((mode: 'default' | 'pan' | 'zoom') => {
    setInteractionMode(mode);
  }, [setInteractionMode]);
  
  /**
   * 处理背景点击，清除选择
   */
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);
  
  /**
   * 处理节点点击，选择节点
   * @param nodeId 节点ID
   */
  const handleNodeClick = useCallback((nodeId: number) => {
    setSelectedNode(nodeId);
  }, [setSelectedNode]);
  
  /**
   * 处理鼠标按下事件，开始平移
   * @param event 鼠标事件
   * @param svgRef SVG元素引用
   */
  const handleMouseDown = useCallback((
    event: React.MouseEvent,
    svgRef: React.RefObject<SVGSVGElement>
  ) => {
    // 在背景上按下鼠标左键
    if (event.button === 0) {
      // 如果是直接在背景上点击（而不是在节点上）
      const isBackgroundClick = (event.target as SVGElement).tagName === 'svg';
      
      if (isBackgroundClick) {
        event.preventDefault();
        setMousePosition(event.clientX, event.clientY);
        
        // 当在背景上按下鼠标左键时，将鼠标更改为"拖动中"样式
        if (svgRef.current) {
          svgRef.current.style.cursor = 'grabbing';
        }
      }
    }
    
    // 中键用于平移或空格键按下时的左键
    if (event.button === 1 || (event.button === 0 && isPanning)) {
      event.preventDefault();
      setMousePosition(event.clientX, event.clientY);
      
      // 当用户按下鼠标左键并处于拖动模式时，将鼠标更改为"拖动中"样式
      if (event.button === 0 && isPanning && svgRef.current) {
        svgRef.current.style.cursor = 'grabbing';
      }
    }
  }, [isPanning, setMousePosition]);
  
  /**
   * 处理鼠标移动事件，更新平移位置
   * @param event 鼠标事件
   */
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    // 处理拖拽时的平移
    if (activelyDragging && !selectedNode) {
      const dx = event.clientX - lastMousePos.x;
      const dy = event.clientY - lastMousePos.y;
      
      // 更新平移位置
      updatePanPosition(dx, dy);
      
      // 更新鼠标位置
      setMousePosition(event.clientX, event.clientY);
    }
  }, [activelyDragging, selectedNode, lastMousePos, updatePanPosition, setMousePosition]);
  
  /**
   * 处理鼠标释放事件，结束平移
   * @param svgRef SVG元素引用
   */
  const handleMouseUp = useCallback((svgRef: React.RefObject<SVGSVGElement>) => {
    // 停止平移拖拽
    if (activelyDragging) {
      stopPanning();
      // 恢复鼠标样式
      if (svgRef.current) {
        svgRef.current.style.cursor = isPanning ? 'grab' : 'default';
      }
    }
  }, [activelyDragging, isPanning, stopPanning]);
  
  /**
   * 计算两个触摸点之间的距离
   */
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  /**
   * 处理触摸开始事件
   * @param event 触摸事件
   */
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
      
      // 如果未选中节点，则设置为平移模式
      if (!selectedNode) {
        if (interactionMode === 'default' || interactionMode === 'pan') {
          setMousePosition(touch.clientX, touch.clientY);
        }
      }
    } else if (event.touches.length === 2) {
      // 双指触摸 - 用于缩放
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      touchDistanceRef.current = getTouchDistance(touch1, touch2);
      
      // 在缩放模式下
      if (interactionMode === 'default' || interactionMode === 'zoom') {
        stopPanning();
      }
    }
  }, [interactionMode, selectedNode, getTouchDistance, setMousePosition, stopPanning]);
  
  /**
   * 处理触摸移动事件
   * @param event 触摸事件
   */
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // 单指移动 - 用于平移
      const touch = event.touches[0];
      
      if (selectedNode) {
        // 如果有选中节点，交给节点拖拽处理
        return;
      } else if (lastTouchRef.current && (interactionMode === 'default' || interactionMode === 'pan')) {
        // 平移视图
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        
        updatePanPosition(dx, dy);
      }
      
      // 更新最后触摸位置
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (event.touches.length === 2 && touchDistanceRef.current !== null) {
      // 双指移动处理会在useGraphTransform中处理
    }
  }, [interactionMode, selectedNode, updatePanPosition]);
  
  /**
   * 处理触摸结束事件
   * @param event 触摸事件
   */
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
        if (!selectedNode) {
          // 点击了背景，取消节点选择
          setSelectedNode(null);
        }
      }
    }
    
    // 重置触摸状态
    stopPanning();
    touchStartRef.current = null;
    lastTouchRef.current = null;
    touchDistanceRef.current = null;
  }, [selectedNode, setSelectedNode, stopPanning]);
  
  /**
   * 处理键盘快捷键
   * @param svgRef SVG元素引用
   */
  useEffect(() => {
    const svgElement = svgRef.current;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape取消选择节点
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }

      // Space键按下 - 启用平移模式
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        startPanning();
        // 当空格键按下时，更改鼠标样式为可拖动
        if (svgElement) {
          svgElement.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Space键松开 - 禁用平移
      if (e.key === ' ') {
        e.preventDefault();
        stopPanning();
        // 当空格键松开时，恢复鼠标样式
        if (svgElement) {
          svgElement.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startPanning, stopPanning, setSelectedNode]);
  
  /**
   * 切换全屏模式
   * @param containerRef 容器元素引用
   */
  const handleToggleFullscreen = useCallback((containerRef: React.RefObject<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!isFullscreen) {
      // 支持不同浏览器的全屏 API
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) { // Safari
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).msRequestFullscreen) { // IE11
        (container as any).msRequestFullscreen();
      }
    } else {
      // 支持不同浏览器的退出全屏 API
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) { // Safari
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { // IE11
        (document as any).msExitFullscreen();
      }
    }
    
    toggleFullscreen();
  }, [isFullscreen, toggleFullscreen]);
  
  /**
   * 监听全屏状态变化
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      // 支持不同浏览器的全屏状态检测
      const isFullscreenNow = !!(document.fullscreenElement || 
                            (document as any).webkitFullscreenElement || 
                            (document as any).msFullscreenElement);
      setFullscreen(isFullscreenNow);
    };

    // 添加各种浏览器的全屏事件监听
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      // 移除监听器
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [setFullscreen]);
  
  return {
    isPanning,
    activelyDragging,
    interactionMode,
    isFullscreen,
    lastMousePos,
    selectedNode,
    setMode,
    handleBackgroundClick,
    handleNodeClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleToggleFullscreen
  };
}
