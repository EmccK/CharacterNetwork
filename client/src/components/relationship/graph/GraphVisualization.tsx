import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphProps, GraphNode, GraphLink } from './types';
import { useGraphStore } from './graphStore';
import GraphNodeComponent from './GraphNode';
import GraphLinkComponent from './GraphLink';
import { Maximize, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';

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
    setSelectedNode, 
    updateNode, 
    updateNodes,
    setInitialData,
  } = useGraphStore();
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [dragging, setDragging] = useState<number | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [activelyDragging, setActivelyDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'default' | 'pan' | 'zoom'>('default'); // 移动设备交互模式
  const nodesMapRef = useRef(new Map<number, GraphNode>());
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef<number | null>(null);
  
  // 触摸事件相关状态
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);
  const touchDistanceRef = useRef<number | null>(null);

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

  // 获取节点颜色
  const getNodeColor = useCallback((characterId: number) => {
    const colors = [
      "#1E88E5", // 蓝色
      "#E53935", // 红色
      "#43A047", // 绿色
      "#FB8C00", // 橙色
      "#8E24AA", // 紫色
      "#00ACC1", // 青色
      "#F9A825", // 黄色
      "#5E35B1", // 深紫色
      "#3949AB", // 靛蓝色
      "#00897B", // 深青色
    ];

    return colors[characterId % colors.length];
  }, []);

  // 初始化图谱数据
  useEffect(() => {
    if (isLoading) return;
    if (!characters.length) return;

    // 计算节点的连接度
    const nodeDegrees = new Map<number, number>();
    relationships.forEach((rel) => {
      nodeDegrees.set(rel.sourceId, (nodeDegrees.get(rel.sourceId) || 0) + 1);
      nodeDegrees.set(rel.targetId, (nodeDegrees.get(rel.targetId) || 0) + 1);
    });

    // 创建节点
    const graphNodes: GraphNode[] = characters.map((character) => ({
      id: character.id,
      name: character.name,
      avatar: character.avatar,
      color: getNodeColor(character.id),
      degree: nodeDegrees.get(character.id) || 0,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height
    }));

    // 创建连接，确保每个连接都有唯一的ID
    const graphLinks: GraphLink[] = relationships.map((relationship, index) => {
      const relType = relationshipTypes.find(type => type.id === relationship.typeId);
      return {
        source: relationship.sourceId,
        target: relationship.targetId,
        type: relType?.name || "未知",
        color: relType?.color || "#94a3b8",
        // 使用关系的唯一ID或添加索引确保ID唯一
        id: relationship.id ? `rel-${relationship.id}` : `rel-${index}-${relationship.sourceId}-${relationship.targetId}`,
        typeId: relationship.typeId
      };
    });

    // 设置初始数据
    setInitialData({
      nodes: graphNodes,
      links: graphLinks
    });

    // 初始化模拟
    if (graphNodes.length > 0) {
      initializeSimulation(graphNodes, graphLinks);
    }

  }, [characters, relationships, relationshipTypes, isLoading, dimensions, getNodeColor, setInitialData]);

  // 初始化D3模拟
  const initializeSimulation = (graphNodes: GraphNode[], graphLinks: GraphLink[]) => {
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 创建力导向图模拟
    try {
      const simulation = d3.forceSimulation<GraphNode>()
        .nodes(graphNodes)
        .force('charge', d3.forceManyBody().strength(-150))
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
        .force('collision', d3.forceCollide().radius(30))
        .force('link', d3.forceLink<GraphNode, any>(graphLinks)
          .id((d: any) => d.id)
          .distance(100))
        .alpha(1)
        .alphaDecay(0.02);

      simulation.on('tick', () => {
        // 重要：每次模拟计算后更新所有节点位置
        const updatedNodes = simulation.nodes();
        updateNodes(updatedNodes);
      });

      // 创建拖拽行为
      const drag = d3.drag<SVGGElement, GraphNode>()
        .on('start', function(event, d) {
          // 确保我们有正确的节点对象
          if (!d || !d.id) return;
          
          // 启动模拟
          if (!event.active) simulation.alphaTarget(0.3).restart();
          
          // 记录节点当前位置并固定它
          d.fx = d.x;
          d.fy = d.y;
          
          // 设置拖拽状态
          setDragging(d.id);
          isDraggingRef.current = true;
          draggedNodeRef.current = d.id;
        })
        .on('drag', function(event, d) {
          // 确保我们有正确的节点对象
          if (!d || !d.id) return;
          
          // 直接更新节点的固定位置
          d.fx = event.x;
          d.fy = event.y;
          
          // 重启模拟以保持平滑过渡
          simulation.alpha(0.3).restart();
        })
        .on('end', function(event, d) {
          // 确保我们有正确的节点对象
          if (!d || !d.id) return;
          
          // 释放节点，但保持其位置
          d.fx = null;
          d.fy = null;
          
          // 重置拖拽状态
          setDragging(null);
          isDraggingRef.current = false;
          draggedNodeRef.current = null;
          
          // 让模拟冷却
          simulation.alphaTarget(0);
        });

      // 将拖拽行为绑定到节点
      setTimeout(() => {
        d3.selectAll('.node-group').call(drag);
      }, 100);

      simulationRef.current = simulation;

    } catch (error) {
      console.error("D3模拟初始化失败:", error);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape取消选择节点
      if (e.key === 'Escape') {
        setSelectedNode(null);
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
  }, [selectedNode, setSelectedNode]);

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

  // 重置并居中视图
  const resetAndCenterView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // 将函数赋值给外部引用
  useEffect(() => {
    graphVisualizationRef.resetAndCenterView = resetAndCenterView;
  }, [resetAndCenterView]);

  // 处理背景点击
  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  // 处理节点点击
  const handleNodeClick = (id: number) => {
    setSelectedNode(id);
  };

  // 处理节点鼠标按下
  const handleNodeMouseDown = (event: React.MouseEvent, id: number) => {
    if (event.button !== 0) return; // 只处理左键点击
    
    event.stopPropagation();
    setDragging(id);
    isDraggingRef.current = true;
    draggedNodeRef.current = id;
    
    // 重要：当开始拖动时，直接更新D3模拟中的节点
    if (simulationRef.current) {
      const node = simulationRef.current.nodes().find(n => n.id === id);
      if (node && node.x !== undefined && node.y !== undefined) {
        // 在D3模拟中直接设置固定坐标
        node.fx = node.x;
        node.fy = node.y;
        
        // 重启模拟以平滑过渡
        simulationRef.current.alpha(0.3).restart();
      }
    }
  };

  // 处理鼠标移动
  const handleMouseMove = (event: React.MouseEvent) => {
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
    if (!dragging || !svgRef.current || !isDraggingRef.current || !simulationRef.current) return;
    
    // 计算拖拽位置
    const rect = svgRef.current.getBoundingClientRect();
    const scale = transform.scale;
    const x = (event.clientX - rect.left - transform.x) / scale;
    const y = (event.clientY - rect.top - transform.y) / scale;
    
    // 直接在D3模拟中更新节点位置
    const node = simulationRef.current.nodes().find(n => n.id === dragging);
    if (node) {
      // 更新固定点坐标
      node.fx = x;
      node.fy = y;
      
      // 保持模拟活跃
      simulationRef.current.alpha(0.3).restart();
    }
  };

  // 处理鼠标释放
  const handleMouseUp = () => {
    // 停止平移拖拽 
    if (activelyDragging) {
      setActivelyDragging(false);
      // 当鼠标释放时，恢复鼠标样式
      if (svgRef.current) {
        // 如果空格键仍然按下，则保持grab样式，否则恢复默认样式
        svgRef.current.style.cursor = isPanning ? 'grab' : 'default';
      }
    }

    // 处理节点拖拽结束
    if (dragging && isDraggingRef.current && simulationRef.current) {
      // 直接在D3模拟中找到节点
      const node = simulationRef.current.nodes().find(n => n.id === dragging);
      
      if (node) {
        // 清除固定坐标，让节点又可以自由移动
        node.fx = null;
        node.fy = null;
      }
      
      // 重置拖拽状态
      setDragging(null);
      isDraggingRef.current = false;
      draggedNodeRef.current = null;
      
      // 让模拟冷却
      simulationRef.current.alphaTarget(0);
    }
  };

  // 使用useEffect来设置滚轮事件监听器，而不是直接在JSX中
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    
    // 使用原生事件API，而不是React合成事件系统
    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      
      // 这里复制handleWheel的逻辑
      if (e.shiftKey) {
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      } else {
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
    
    // 清理
    return () => {
      svgElement.removeEventListener('wheel', wheelListener);
    };
  }, [transform.scale, transform.x, transform.y]);

  // 计算两个触摸点之间的距离
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理触摸开始事件
  const handleTouchStart = (event: React.TouchEvent) => {
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
  };

  // 处理触摸移动事件
  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // 单指移动 - 用于平移或拖动节点
      const touch = event.touches[0];
      
      if (draggedNodeRef.current !== null && isDraggingRef.current && simulationRef.current) {
        // 拖动节点
        if (!svgRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const scale = transform.scale;
        const x = (touch.clientX - rect.left - transform.x) / scale;
        const y = (touch.clientY - rect.top - transform.y) / scale;
        
        // 更新节点位置
        const node = simulationRef.current.nodes().find(n => n.id === draggedNodeRef.current);
        if (node) {
          node.fx = x;
          node.fy = y;
          simulationRef.current.alpha(0.3).restart();
        }
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
  };

  // 处理触摸结束事件
  const handleTouchEnd = (event: React.TouchEvent) => {
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
          setSelectedNode(null);
        }
      }
    }
    
    // 结束拖动状态
    if (draggedNodeRef.current !== null && isDraggingRef.current && simulationRef.current) {
      const node = simulationRef.current.nodes().find(n => n.id === draggedNodeRef.current);
      if (node) {
        // 释放节点
        node.fx = null;
        node.fy = null;
      }
      
      // 重置拖拽状态
      setDragging(null);
      isDraggingRef.current = false;
      draggedNodeRef.current = null;
      
      // 冷却模拟
      simulationRef.current.alphaTarget(0);
    }
    
    // 重置触摸状态
    setActivelyDragging(false);
    touchStartRef.current = null;
    lastTouchRef.current = null;
    touchDistanceRef.current = null;
  };

  // 当DOM加载后应用拖拽行为
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current || nodes.length === 0) return;
    
    // 在D3模拟中重新绑定拖拽行为
    const updateDragBehavior = () => {
      const simulation = simulationRef.current;
      if (!simulation) return;
      
      // 创建拖拽行为
      const drag = d3.drag<SVGGElement, GraphNode>()
        .on('start', function(event) {
          // 从元素的data-id获取节点ID
          const nodeId = parseInt(d3.select(this).attr('data-id'));
          if (isNaN(nodeId)) return;
          
          // 找到模拟中的节点
          const simNode = simulation.nodes().find(n => n.id === nodeId);
          if (!simNode) return;
          
          // 启动模拟
          if (!event.active) simulation.alphaTarget(0.3).restart();
          
          // 记录节点当前位置并固定它
          simNode.fx = simNode.x;
          simNode.fy = simNode.y;
          
          // 设置拖拽状态
          setDragging(nodeId);
          isDraggingRef.current = true;
          draggedNodeRef.current = nodeId;
        })
        .on('drag', function(event) {
          // 从元素的data-id获取节点ID
          const nodeId = parseInt(d3.select(this).attr('data-id'));
          if (isNaN(nodeId)) return;
          
          // 找到模拟中的节点
          const simNode = simulation.nodes().find(n => n.id === nodeId);
          if (!simNode) return;
          
          // 直接更新节点的固定位置
          simNode.fx = event.x;
          simNode.fy = event.y;
          
          // 重启模拟以保持平滑过渡
          simulation.alpha(0.3).restart();
        })
        .on('end', function(event) {
          // 从元素的data-id获取节点ID
          const nodeId = parseInt(d3.select(this).attr('data-id'));
          if (isNaN(nodeId)) return;
          
          // 找到模拟中的节点
          const simNode = simulation.nodes().find(n => n.id === nodeId);
          if (!simNode) return;
          
          // 释放节点，但保持其位置
          simNode.fx = null;
          simNode.fy = null;
          
          // 重置拖拽状态
          setDragging(null);
          isDraggingRef.current = false;
          draggedNodeRef.current = null;
          
          // 让模拟冷却
          simulation.alphaTarget(0);
        });

      // 应用拖拽行为到所有节点
      d3.select(svgRef.current)
        .selectAll('.node-group')
        .call(drag);
    };
    
    // 更新拖拽行为
    updateDragBehavior();
    
    // 第一次调用时可能还没有渲染好节点，稍等一下
    const timer = setTimeout(updateDragBehavior, 200);
    
    return () => clearTimeout(timer);
  }, [nodes.length, simulationRef.current, svgRef.current]);

  // 处理鼠标按下
  const handleMouseDown = (event: React.MouseEvent) => {
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
  };
  
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
        // onWheel被移到useEffect中使用原生API
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
              onClick={() => setInteractionMode(interactionMode === 'pan' ? 'default' : 'pan')}
              className={`rounded-full p-2 shadow-md transition-colors ${interactionMode === 'pan' ? 'bg-blue-100' : 'bg-white'}`}
              size="icon"
              variant="ghost"
              title="移动模式"
            >
              <Move className={`w-5 h-5 ${interactionMode === 'pan' ? 'text-blue-600' : 'text-gray-500'}`} />
            </Button>
            <Button
              onClick={() => setInteractionMode(interactionMode === 'zoom' ? 'default' : 'zoom')}
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
