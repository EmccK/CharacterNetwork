import React, { useEffect, useRef, useState } from 'react';
import type { GraphProps, GraphNode } from './types';
import { useGraphStore } from './graphStore';
import GraphNodeComponent from './GraphNode';
import GraphLinkComponent from './GraphLink';
import { Maximize, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { useGraphSimulation } from '@/hooks/use-graph-simulation';
import { useGraphInteractions } from '@/hooks/use-graph-interactions';

// 创建一个可以从外部调用的引用
export const graphVisualizationRef = {
  resetAndCenterView: () => {}
};

const GraphVisualization: React.FC<GraphProps> = ({
  characters,
  relationships,
  relationshipTypes,
  isLoading = false,
  onNodeSelect
}) => {
  const isMobile = useIsMobile();
  const { 
    nodes, 
    links, 
    selectedNode, 
    setSelectedNode
  } = useGraphStore();
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const nodesMapRef = useRef(new Map<number, GraphNode>());
  
  // 使用自定义hooks
  const {
    simulation,
    isSimulationReady,
    startSimulation,
    stopSimulation,
    updateNodePosition,
    releaseNode
  } = useGraphSimulation({
    characters,
    relationships,
    relationshipTypes,
    dimensions
  });

  const {
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
  } = useGraphInteractions({
    svgRef,
    updateNodePosition,
    releaseNode,
    startSimulation,
    stopSimulation,
    onNodeSelect
  });

  // 更新节点映射以便快速访问
  useEffect(() => {
    nodesMapRef.current = new Map(nodes.map(node => [node.id, node]));
  }, [nodes]);

  // 当选中节点变化时，调用onNodeSelect回调
  useEffect(() => {
    if (onNodeSelect && selectedNode !== null) {
      const selectedCharacter = characters.find(c => c.id === selectedNode) || null;
      onNodeSelect(selectedCharacter);
    } else if (onNodeSelect && selectedNode === null) {
      onNodeSelect(null);
    }
  }, [selectedNode, characters, onNodeSelect]);

  // 将函数赋值给外部引用
  useEffect(() => {
    graphVisualizationRef.resetAndCenterView = resetAndCenterView;
  }, [resetAndCenterView]);

  // 监听窗口尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  // 全屏切换
  const toggleFullscreen = () => {
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
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      // 支持不同浏览器的全屏状态检测
      const isFullscreenNow = !!(document.fullscreenElement || 
                              (document as any).webkitFullscreenElement || 
                              (document as any).msFullscreenElement);
      setIsFullscreen(isFullscreenNow);
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
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px] bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-[500px] bg-gray-50 relative"
      style={{ 
        height: isFullscreen ? '100vh' : '500px',
        // 确保全屏时有正确的宽度，并覆盖浏览器界面
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        onClick={handleBackgroundClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* 绘制连接线 */}
          {links.map(link => (
            <GraphLinkComponent 
              key={link.id} 
              link={link} 
              nodesMap={nodesMapRef.current} 
              selectedNode={selectedNode}
            />
          ))}
          
          {/* 绘制节点 */}
          {nodes.map(node => (
            <GraphNodeComponent
              key={`node-${node.id}`}
              node={node}
              transform="" // 不再需要在这里设置变换，由组件内部处理
              selected={node.id === selectedNode}
              onNodeClick={handleNodeClick}
              onNodeMouseDown={handleNodeMouseDown}
            />
          ))}
        </g>
      </svg>

      {/* 控制区 */}
      <div className="absolute bottom-5 right-5 flex space-x-2 justify-end z-10">
        {isMobile && (
          <>
            <Button
              onClick={() => setMode('pan')}
              className={`rounded-full p-2 shadow-md transition-colors ${interactionMode === 'pan' ? 'bg-blue-100' : 'bg-white'}`}
              size="icon"
              variant="ghost"
              title="移动模式"
            >
              <Move className={`w-5 h-5 ${interactionMode === 'pan' ? 'text-blue-600' : 'text-gray-500'}`} />
            </Button>
            <Button
              onClick={() => setMode('zoom')}
              className={`rounded-full p-2 shadow-md transition-colors ${interactionMode === 'zoom' ? 'bg-blue-100' : 'bg-white'}`}
              size="icon"
              variant="ghost"
              title="缩放模式"
            >
              <ZoomIn className={`w-5 h-5 ${interactionMode === 'zoom' ? 'text-blue-600' : 'text-gray-500'}`} />
            </Button>
          </>
        )}
        <Button
          onClick={resetAndCenterView}
          className="rounded-full bg-white p-2 shadow-md hover:bg-gray-50 transition-colors"
          size="icon"
          variant="ghost"
          title="中心化视图"
        >
          <Maximize className="w-5 h-5 text-green-500" />
        </Button>
        <Button
          onClick={toggleFullscreen}
          className="rounded-full bg-white p-2 shadow-md hover:bg-gray-50 transition-colors"
          size="icon"
          variant="ghost"
          title={isFullscreen ? "退出全屏" : "全屏显示"}
        >
          {isFullscreen ? 
            <Maximize className="w-5 h-5 text-blue-500 rotate-45" /> : 
            <Maximize className="w-5 h-5 text-blue-500" />}
        </Button>
      </div>

      {/* 操作提示 */}
      {nodes.length > 0 && (
        <div className="absolute top-2 right-5 bg-white p-2 rounded text-xs text-gray-500 opacity-60 hover:opacity-100 transition-opacity z-10">
          {isMobile ? (
            <>单指拖动: 移动视图 | 双指捕合: 缩放 | 点击节点: 选择</>
          ) : (
            <>空格+拖动: 平移视图 | 滚轮: 缩放 | Esc: 取消选择</>
          )}
        </div>
      )}

      {/* 没有数据时的提示 */}
      {nodes.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-1">没有关系数据</h3>
          <p className="text-sm">请添加角色和关系来构建关系图谱</p>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;