import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from 'd3';
import { Character, Relationship, RelationshipType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Search, ZoomIn, ZoomOut, RefreshCw, Download, Filter, Check, X, Maximize, Minimize } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";

interface RelationshipGraphProps {
  characters: Character[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  isLoading?: boolean;
}

interface Node extends d3.SimulationNodeDatum {
  id: number;
  name: string;
  avatar?: string;
  color: string;
  radius: number;
  selected: boolean;
  degree: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: Node | number;
  target: Node | number;
  type: string;
  color: string;
  id: string;
  selected: boolean;
}

export default function ObsidianRelationshipGraph({
  characters,
  relationships,
  relationshipTypes,
  isLoading = false
}: RelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [transform, setTransform] = useState<{ k: number; x: number; y: number }>({ k: 1, x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [nodeSize, setNodeSize] = useState(20);
  const [filteredRelationshipTypes, setFilteredRelationshipTypes] = useState<number[]>([]);
  const [highlightConnections, setHighlightConnections] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGraphInitialized, setIsGraphInitialized] = useState(false);

  // 获取节点颜色
  const getNodeColor = useCallback((character: Character) => {
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

    return colors[character.id % colors.length];
  }, []);

  // 更新图谱绘制 - 使用useCallback保证引用稳定性
  const updateGraph = useCallback(() => {
    console.log("尝试更新图谱", { 
      svgRef: !!svgRef.current, 
      nodesLength: nodes.length, 
      linksLength: links.length 
    });
    
    if (!svgRef.current || nodes.length === 0 || links.length === 0) {
      console.log("更新图谱失败：缺少必要元素或数据");
      return;
    }

    const svg = d3.select(svgRef.current).select('g.graph-container');
    console.log("选择图谱容器", { 容器存在: !svg.empty() });
    
    // 确保容器存在
    if (svg.empty()) {
      console.log("创建新的图谱容器");
      d3.select(svgRef.current).append('g')
        .attr('class', 'graph-container');
      return updateGraph(); // 重新调用以继续渲染
    }
    
    console.log("开始准备显示数据");
    const filteredNodes = nodes.map(node => ({
      ...node,
      selected: searchTerm ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    }));
    console.log("过滤后的节点", filteredNodes);
    
    // 过滤关系类型
    const filteredLinks = links.map(link => {
      const relType = relationshipTypes.find(type => type.name === link.type);
      return {
        ...link,
        selected: relType ? !filteredRelationshipTypes.includes(relType.id) : true
      };
    });
    console.log("过滤后的连接", filteredLinks);
    
    // 高亮连接
    const highlightedLinks = filteredLinks.map(link => {
      if (!highlightConnections || !selectedNode) return { ...link };
      
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      // 如果连接与选中节点相关，则高亮显示
      const isConnectedToSelected = sourceId === selectedNode.id || targetId === selectedNode.id;
      return {
        ...link,
        selected: isConnectedToSelected && link.selected
      };
    });

    console.log("开始绘制连接，数量", highlightedLinks.length);
    // 绘制连接线
    const link = svg.selectAll<SVGGElement, Link>('.graph-link')
      .data(highlightedLinks, d => d.id);

    console.log("当前已绘制连接数量", link.size());
    // 移除不再需要的连接
    const exitingLinks = link.exit();
    console.log("需要移除的连接数量", exitingLinks.size());
    exitingLinks.remove();

    // 添加新连接
    const linkEnter = link.enter()
      .append('g')
      .attr('class', 'graph-link');
    console.log("新添加的连接数量", linkEnter.size());

    // 添加连接线
    linkEnter
      .append('line')
      .attr('stroke-width', 1.5)
      .attr('stroke', d => d.color)
      .attr('opacity', d => d.selected ? 0.8 : 0.2);

    // 更新所有连接线（新的和现有的）
    svg.selectAll<SVGLineElement, Link>('.graph-link line')
      .attr('stroke', d => d.color)
      .attr('opacity', d => d.selected ? 0.8 : 0.2)
      .attr('x1', d => {
        const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
        return source?.x || 0;
      })
      .attr('y1', d => {
        const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
        return source?.y || 0;
      })
      .attr('x2', d => {
        const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
        return target?.x || 0;
      })
      .attr('y2', d => {
        const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
        return target?.y || 0;
      });

    // 绘制连接标签
    if (showLabels) {
      // 先移除现有的标签，防止重复
      svg.selectAll('.graph-link text').remove();
      
      // 添加新标签
      svg.selectAll('.graph-link')
        .append('text')
        .attr('class', 'link-label')
        .attr('dy', -5)
        .attr('text-anchor', 'middle')
        .text(d => d.type)
        .attr('opacity', d => d.selected ? 0.8 : 0.2)
        .attr('x', d => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
          return ((source?.x || 0) + (target?.x || 0)) / 2;
        })
        .attr('y', d => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
          return ((source?.y || 0) + (target?.y || 0)) / 2;
        });
    } else {
      svg.selectAll('.link-label').remove();
    }

    console.log("开始绘制节点");
    // 绘制节点
    const node = svg.selectAll<SVGGElement, Node>('.graph-node')
      .data(filteredNodes, d => d.id.toString());

    console.log("当前已绘制节点数量", node.size());
    // 移除不再需要的节点
    const exitingNodes = node.exit();
    console.log("需要移除的节点数量", exitingNodes.size());
    exitingNodes.remove();

    // 添加新节点
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'graph-node')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('mouseover', (event, d) => handleNodeHover(d))
      .on('mouseout', () => {
        if (!selectedNode) {
          setHighlightConnections(false);
        }
      })
      .on('click', (event, d) => handleNodeClick(d));
      
    console.log("新添加的节点数量", nodeEnter.size());

    // 添加节点背景圆
    nodeEnter
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('opacity', 0.8)
      .attr('stroke', 'none')
      .attr('stroke-width', 2);

    // 添加节点标签
    nodeEnter
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => Math.min(d.radius * 0.8, 12))
      .text(d => d.name.substring(0, 2));

    // 更新所有节点的位置和样式
    svg.selectAll<SVGGElement, Node>('.graph-node')
      .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
      .select('circle')
      .attr('r', d => d.radius) // 确保更新半径
      .attr('fill', d => d.color)
      .attr('opacity', d => {
        if (searchTerm && !d.selected) return 0.3;
        if (selectedNode && d.id !== selectedNode.id && !isConnectedToSelectedNode(d)) return 0.3;
        return 0.8;
      })
      .attr('stroke', d => (selectedNode && d.id === selectedNode.id) ? '#fff' : 'none');

    // 更新节点中心文本
    svg.selectAll<SVGTextElement, Node>('.graph-node .node-label')
      .attr('font-size', d => Math.min(d.radius * 0.8, 12));

    // 添加或更新节点名称标签
    if (showLabels) {
      console.log("添加节点名称标签，显示标签状态", showLabels);
      // 移除现有名称标签
      const existingLabels = svg.selectAll('.node-name');
      console.log("现有标签数量", existingLabels.size());
      existingLabels.remove();
      
      // 为每个节点添加名称标签
      const nodes = svg.selectAll('.graph-node');
      console.log("为节点添加标签，节点数量", nodes.size());
      
      nodes.append('text')
        .attr('class', 'node-name')
        .attr('text-anchor', 'middle')
        .attr('dy', d => d.radius + 15)
        .text(d => d.name)
        .attr('opacity', d => {
          if (searchTerm && !d.selected) return 0.3;
          if (selectedNode && d.id !== selectedNode.id && !isConnectedToSelectedNode(d)) return 0.3;
          return 1;
        });
        
      console.log("标签添加完成");
    } else {
      console.log("移除所有节点名称标签");
      svg.selectAll('.node-name').remove();
    }
  }, [nodes, links, showLabels, searchTerm, selectedNode, highlightConnections, filteredRelationshipTypes, relationshipTypes]);

  // 检查节点是否与选中节点相连
  const isConnectedToSelectedNode = useCallback((node: Node): boolean => {
    if (!selectedNode) return false;
    
    return links.some(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      return (sourceId === selectedNode.id && targetId === node.id) ||
             (sourceId === node.id && targetId === selectedNode.id);
    });
  }, [selectedNode, links]);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setWidth(width);
        setHeight(height);
        
        // 如果已存在模拟，更新中心力
        if (simulationRef.current) {
          simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2));
          simulationRef.current.alpha(0.3).restart();
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  // 页面加载后延迟初始化图谱
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (characters.length > 0 && relationships.length > 0 && !isLoading) {
      // 延迟一秒强制初始化，确保 DOM 已完全加载
      timer = setTimeout(() => {
        console.log('延迟初始化执行');
        if (svgRef.current && !isGraphInitialized && nodes.length === 0) {
          console.log('强制初始化图谱...');

          // 计算节点的连接度
          const nodeDegrees = new Map<number, number>();
          relationships.forEach((rel) => {
            nodeDegrees.set(rel.sourceId, (nodeDegrees.get(rel.sourceId) || 0) + 1);
            nodeDegrees.set(rel.targetId, (nodeDegrees.get(rel.targetId) || 0) + 1);
          });
          
          // 创建节点
          const graphNodes: Node[] = characters.map((character) => ({
            id: character.id,
            name: character.name, 
            avatar: character.avatar,
            color: getNodeColor(character),
            radius: Math.max(nodeSize, 12 + (nodeDegrees.get(character.id) || 0) * 2),
            selected: true,
            degree: nodeDegrees.get(character.id) || 0
          }));
          
          // 创建连接
          const graphLinks: Link[] = relationships.map((relationship) => {
            const relType = relationshipTypes.find(type => type.id === relationship.typeId);
            return {
              source: relationship.sourceId,
              target: relationship.targetId,
              type: relType?.name || "未知",
              color: relType?.color || "#94a3b8",
              id: `${relationship.sourceId}-${relationship.targetId}`,
              selected: true
            };
          });
          
          setNodes(graphNodes);
          setLinks(graphLinks);
          
          // 初始化力导向图模拟
          if (simulationRef.current) simulationRef.current.stop();
          
          const sim = d3.forceSimulation<Node>(graphNodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('link', d3.forceLink<Node, Link>(graphLinks)
              .id(d => d.id)
              .distance(100)
            )
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .force('collision', d3.forceCollide().radius(d => (d as Node).radius + 5))
            .on('tick', () => {
              graphNodes.forEach(node => {
                node.x = Math.max(node.radius, Math.min(width - node.radius, node.x || width/2));
                node.y = Math.max(node.radius, Math.min(height - node.radius, node.y || height/2));
              });
              updateGraph();
            });
          
          simulationRef.current = sim;
          sim.alpha(1).restart();
          setIsGraphInitialized(true);
          
          // 设置初始缩放
          setTimeout(() => {
            if (svgRef.current) {
              console.log('设置初始缩放');
              const svg = d3.select(svgRef.current);
              const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]);
              svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 4).scale(0.8));
            }
          }, 500);
        } else {
          console.log('跳过延迟初始化', { 是否有SVG: !!svgRef.current, 是否已初始化: isGraphInitialized, 节点数: nodes.length });
        }
      }, 1000);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [characters, relationships, width, height, isLoading, updateGraph]);

  // 初始化图谱数据
  useEffect(() => {
    console.log("数据初始化开始", { 
      charactersLength: characters.length, 
      relationshipsLength: relationships.length,
      isLoading
    });
    
    if (isLoading) return;
    
    if (!characters.length || !relationships.length) {
      // 重置状态
      console.log("没有足够的数据，重置图谱");
      setNodes([]);
      setLinks([]);
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      setIsGraphInitialized(false);
      return;
    }

    console.log("开始准备图谱数据");
    // 计算节点的连接度
    const nodeDegrees = new Map<number, number>();
    relationships.forEach((rel) => {
      nodeDegrees.set(rel.sourceId, (nodeDegrees.get(rel.sourceId) || 0) + 1);
      nodeDegrees.set(rel.targetId, (nodeDegrees.get(rel.targetId) || 0) + 1);
    });
    console.log("节点连接度计算完成", [...nodeDegrees.entries()]);

    // 创建节点
    const graphNodes: Node[] = characters.map((character) => {
      return {
        id: character.id,
        name: character.name,
        avatar: character.avatar,
        color: getNodeColor(character),
        radius: Math.max(nodeSize, 12 + (nodeDegrees.get(character.id) || 0) * 2),
        selected: true,
        degree: nodeDegrees.get(character.id) || 0
      };
    });
    console.log("创建节点完成", graphNodes);

    // 创建连接
    const graphLinks: Link[] = relationships.map((relationship) => {
      const relType = relationshipTypes.find(type => type.id === relationship.typeId);
      return {
        source: relationship.sourceId,
        target: relationship.targetId,
        type: relType?.name || "未知",
        color: relType?.color || "#94a3b8",
        id: `${relationship.sourceId}-${relationship.targetId}`,
        selected: true
      };
    });
    console.log("创建连接完成", graphLinks);

    setNodes(graphNodes);
    setLinks(graphLinks);
    console.log("节点和连接状态已更新");

    // 初始化力导向图模拟
    initializeSimulation(graphNodes, graphLinks);
    setIsGraphInitialized(true);
    console.log("力导向图初始化完成");

    return () => {
      // 组件卸载时停止模拟
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [characters, relationships, relationshipTypes, isLoading, getNodeColor]);

  // 更新节点半径
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // 只更新节点半径，不重新创建节点和链接
    const updatedNodes = nodes.map(node => ({
      ...node,
      radius: Math.max(nodeSize, 12 + node.degree * 2)
    }));
    
    setNodes(updatedNodes);
    
    // 如果模拟存在，调整碰撞力以适应新的节点大小
    if (simulationRef.current) {
      simulationRef.current
        .force('collision', d3.forceCollide().radius(d => (d as Node).radius + 5))
        .alpha(0.1)
        .restart();
    }
  }, [nodeSize]);

  // 初始化D3模拟
  const initializeSimulation = (nodes: Node[], links: Link[]) => {
    console.log("开始初始化模拟", { 节点数: nodes.length, 连接数: links.length, 宽度: width, 高度: height });
    
    if (simulationRef.current) {
      console.log("停止现有模拟");
      simulationRef.current.stop();
    }

    // 创建力导向图模拟
    const sim = d3.forceSimulation<Node>(nodes)
      .force('charge', d3.forceManyBody().strength(-500)) // 增加斥力强度
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('link', d3.forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance(100) // 设置链接距离
      )
      .force('x', d3.forceX(width / 2).strength(0.05)) // 添加水平方向的力
      .force('y', d3.forceY(height / 2).strength(0.05)) // 添加垂直方向的力
      .force('collision', d3.forceCollide().radius(d => (d as Node).radius + 5))
      .on('tick', () => {
        console.log("模拟计算中 - tick");
        // 确保节点不会超出边界
        nodes.forEach(node => {
          node.x = Math.max(node.radius, Math.min(width - node.radius, node.x || width/2));
          node.y = Math.max(node.radius, Math.min(height - node.radius, node.y || height/2));
        });
        updateGraph();
      });

    // 保存模拟引用
    simulationRef.current = sim;
    console.log("模拟已创建并保存到引用");
    
    // 立即启动模拟
    sim.alpha(1).restart();
    console.log("模拟已启动，alpha值设为1");
  };

  // 设置D3的缩放功能
  useEffect(() => {
    console.log("尝试设置缩放功能", { svgRef: !!svgRef.current, isGraphInitialized });
    if (!svgRef.current || !isGraphInitialized) return;

    // 清除旧的zoom行为
    d3.select(svgRef.current).on('.zoom', null);
    console.log("旧的缩放行为已清除");

    const svg = d3.select(svgRef.current);
    console.log("选择SVG元素", { 宽度: width, 高度: height });
    
    // 添加zoom行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        console.log("缩放事件", event.transform);
        setTransform({
          k: event.transform.k,
          x: event.transform.x,
          y: event.transform.y
        });
        
        svg.select('g.graph-container')
          .attr('transform', event.transform.toString());
      });

    console.log("设置缩放行为");
    svg.call(zoom);
    
    // 初始化位置 - 确保图谱显示在视图中心
    console.log("设置初始缩放位置");
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 4).scale(0.8));
    console.log("初始缩放设置完成");

    // 检查图谱容器
    console.log("图谱容器状态", { 
      容器存在: svg.select('g.graph-container').size() > 0 
    });

    // 清理函数
    return () => {
      svg.on('.zoom', null);
    };
  }, [width, height, isGraphInitialized]);

  // 拖拽事件处理
  const dragstarted = (event: any, d: Node) => {
    if (!event.active && simulationRef.current) 
      simulationRef.current.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  };

  const dragged = (event: any, d: Node) => {
    d.fx = event.x;
    d.fy = event.y;
    
    // 立即更新图形，提供更平滑的拖拽体验
    updateGraph();
  };

  const dragended = (event: any, d: Node) => {
    if (!event.active && simulationRef.current) 
      simulationRef.current.alphaTarget(0);
      
    // 重要: 不要完全释放节点，否则会导致节点回到一条线上
    // 这里我们保持fx/fy的值，使节点留在拖动后的位置
    // 注意：只有手动重置图表时才会清除所有节点的固定位置
  };

  // 节点悬停处理
  const handleNodeHover = (node: Node) => {
    setHighlightConnections(true);
    setSelectedNode(node);
  };

  // 节点点击处理
  const handleNodeClick = (node: Node) => {
    if (selectedNode && selectedNode.id === node.id) {
      setSelectedNode(null);
      setHighlightConnections(false);
    } else {
      setSelectedNode(node);
      setHighlightConnections(true);
    }
  };

  // 重置图形布局
  const handleReset = () => {
    if (!svgRef.current || !simulationRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    // 重置缩放和平移
    svg.transition().duration(750).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity.translate(width / 4, height / 4).scale(0.8)
    );
    
    // 重置状态
    setSearchTerm('');
    setSelectedNode(null);
    setHighlightConnections(false);
    setFilteredRelationshipTypes([]);
    
    // 重要: 释放所有节点的固定位置
    nodes.forEach(node => {
      node.fx = null;
      node.fy = null;
    });
    
    // 重新启动模拟以重新排列节点
    simulationRef.current.alpha(1).restart();
  };

  // 关系类型过滤切换
  const toggleRelationshipTypeFilter = (typeId: number) => {
    setFilteredRelationshipTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId) 
        : [...prev, typeId]
    );
  };

  // 显示标签切换
  const toggleShowLabels = () => {
    setShowLabels(!showLabels);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 缩放控制
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3]);
    
    svg.transition().duration(300).call(
      zoom.transform as any,
      d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k + 0.1)
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3]);
    
    svg.transition().duration(300).call(
      zoom.transform as any,
      d3.zoomIdentity.translate(transform.x, transform.y).scale(Math.max(0.3, transform.k - 0.1))
    );
  };

  // 导出SVG
  const handleExport = () => {
    if (!svgRef.current) return;

    // 创建SVG的副本用于导出
    const originalSvg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(originalSvg);
    
    // 创建一个新的SVG文档，设置正确的尺寸
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    const exportSvg = svgDoc.documentElement;
    
    exportSvg.setAttribute('width', width.toString());
    exportSvg.setAttribute('height', height.toString());
    
    // 将SVG转换为Blob
    const svgBlob = new Blob([new XMLSerializer().serializeToString(exportSvg)], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = 'character-relationship-graph.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px] bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 bg-yellow-100 p-2 rounded">
        <p className="text-sm font-semibold">调试信息</p>
        <p className="text-sm">节点数：{nodes.length}, 连接数：{links.length}, 图谱初始化：{isGraphInitialized ? '是' : '否'}</p>
        <div className="mt-1 flex space-x-2">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
            onClick={() => {
              console.log('强制初始化节点和连接');
              
              // 手动创建节点和连接
              if (!characters.length || !relationships.length) {
                console.log('缺少角色或关系数据');
                return;
              }
              
              // 计算节点的连接度
              const nodeDegrees = new Map<number, number>();
              relationships.forEach((rel) => {
                nodeDegrees.set(rel.sourceId, (nodeDegrees.get(rel.sourceId) || 0) + 1);
                nodeDegrees.set(rel.targetId, (nodeDegrees.get(rel.targetId) || 0) + 1);
              });
              
              // 创建节点
              const graphNodes: Node[] = characters.map((character) => ({
                id: character.id,
                name: character.name,
                avatar: character.avatar,
                color: getNodeColor(character),
                radius: Math.max(nodeSize, 12 + (nodeDegrees.get(character.id) || 0) * 2),
                selected: true,
                degree: nodeDegrees.get(character.id) || 0
              }));
              
              // 创建连接
              const graphLinks: Link[] = relationships.map((relationship) => {
                const relType = relationshipTypes.find(type => type.id === relationship.typeId);
                return {
                  source: relationship.sourceId,
                  target: relationship.targetId,
                  type: relType?.name || "未知",
                  color: relType?.color || "#94a3b8",
                  id: `${relationship.sourceId}-${relationship.targetId}`,
                  selected: true
                };
              });
              
              console.log('设置节点和连接', { 节点数: graphNodes.length, 连接数: graphLinks.length });
              setNodes(graphNodes);
              setLinks(graphLinks);
              
              // 重新初始化模拟
              if (simulationRef.current) {
                simulationRef.current.stop();
              }
              
              console.log('启动新模拟');
              const sim = d3.forceSimulation<Node>(graphNodes)
                .force('charge', d3.forceManyBody().strength(-500))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('link', d3.forceLink<Node, Link>(graphLinks)
                  .id(d => d.id)
                  .distance(100)
                )
                .force('x', d3.forceX(width / 2).strength(0.05))
                .force('y', d3.forceY(height / 2).strength(0.05))
                .force('collision', d3.forceCollide().radius(d => (d as Node).radius + 5))
                .on('tick', () => {
                  graphNodes.forEach(node => {
                    node.x = Math.max(node.radius, Math.min(width - node.radius, node.x || width/2));
                    node.y = Math.max(node.radius, Math.min(height - node.radius, node.y || height/2));
                  });
                  updateGraph();
                });
              
              simulationRef.current = sim;
              sim.alpha(1).restart();
              setIsGraphInitialized(true);
            }}
          >
            强制初始化图谱
          </button>
          
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
            onClick={() => {
              if (svgRef.current) {
                console.log('手动初始化缩放');
                const svg = d3.select(svgRef.current);
                const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]);
                svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 4).scale(0.8));
                updateGraph();
              }
            }}
          >
            强制设置缩放
          </button>

          <button 
            className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs"
            onClick={() => {
              if (svgRef.current) {
                console.log('检查节点和连接');
                const svg = d3.select(svgRef.current);
                const container = svg.select('g.graph-container');
                
                if (container.empty()) {
                  console.log('容器不存在，尝试创建');
                  svg.append('g').attr('class', 'graph-container');
                } else {
                  console.log('容器已存在');
                }
                
                const nodeElements = container.selectAll('.graph-node');
                console.log(`当前存在 ${nodeElements.size()} 个节点元素`);
                
                const linkElements = container.selectAll('.graph-link');
                console.log(`当前存在 ${linkElements.size()} 个连接元素`);
                
                if (nodeElements.size() === 0 && nodes.length > 0) {
                  console.log('手动尝试添加节点');
                  
                  // 尝试手动创建一个节点作为测试
                  container.append('circle')
                    .attr('cx', width / 2)
                    .attr('cy', height / 2)
                    .attr('r', 30)
                    .attr('fill', 'red');
                    
                  console.log('测试节点已添加');
                }
                
                // 尝试强制更新
                updateGraph();
              }
            }}
          >
            检查图形元素
          </button>
        </div>
      </div>
      
      {/* 工具栏 */}
      <div className="mb-4 flex flex-wrap gap-2 items-center bg-gray-100 rounded-lg p-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-8"
            placeholder="搜索角色..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" /> 关系类型
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-2">
            <div className="space-y-2">
              {relationshipTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm flex-1">{type.name}</span>
                  <Toggle
                    pressed={!filteredRelationshipTypes.includes(type.id)}
                    onPressedChange={() => toggleRelationshipTypeFilter(type.id)}
                    size="sm"
                  >
                    <Check className="h-3 w-3" />
                  </Toggle>
                </div>
              ))}
              {relationshipTypes.length === 0 && (
                <div className="py-1 text-sm text-gray-500">尚无关系类型</div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={toggleShowLabels}>
          {showLabels ? "隐藏标签" : "显示标签"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              节点大小: {nodeSize}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-2">
            <div className="space-y-2 p-2">
              <Slider 
                value={[nodeSize]}
                min={10}
                max={30}
                step={1}
                onValueChange={([value]) => setNodeSize(value)}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* 图谱容器 */}
      <div 
        ref={containerRef}
        className="bg-gray-900 rounded-lg overflow-hidden relative"
        style={{ height: isFullscreen ? '100vh' : '500px' }}
      >
        <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs z-10">
          SVG状态: {svgRef.current ? '已创建' : '未创建'}, 
          容器尺寸: {width}x{height}, 
          缩放: {transform.k.toFixed(1)}x
        </div>
        <svg 
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full"
        >
          <g className="graph-container"></g>
        </svg>

        {/* 信息面板 - 显示选中节点信息 */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
              <h3 className="font-medium">{selectedNode.name}</h3>
              <button 
                className="ml-auto text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSelectedNode(null);
                  setHighlightConnections(false);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <p>连接数: {selectedNode.degree}</p>
              <div className="mt-1">
                <p>相关角色:</p>
                <ul className="mt-1 space-y-1">
                  {links
                    .filter(link => {
                      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                      return sourceId === selectedNode.id || targetId === selectedNode.id;
                    })
                    .map((link, index) => {
                      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                      const connectedId = sourceId === selectedNode.id ? targetId : sourceId;
                      const connectedNode = nodes.find(n => n.id === connectedId);
                      
                      return (
                        <li key={index} className="flex items-center gap-1">
                          <span 
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: link.color }}
                          ></span>
                          <span>{link.type}: </span>
                          <button 
                            className="text-primary-600 hover:underline"
                            onClick={() => {
                              if (connectedNode) {
                                setSelectedNode(connectedNode);
                              }
                            }}
                          >
                            {connectedNode?.name}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 没有数据时的提示 */}
        {nodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="bg-gray-800 rounded-full p-4 mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">没有关系数据</h3>
            <p className="text-sm text-gray-400">添加角色和关系来开始构建关系图</p>
          </div>
        )}
      </div>

      {/* 图例 */}
      {relationshipTypes.length > 0 && (
        <div className="mt-4 bg-gray-100 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">关系类型</h4>
          <div className="flex flex-wrap gap-2">
            {relationshipTypes.map((type) => (
              <div 
                key={type.id} 
                className="flex items-center bg-white px-2 py-1 rounded-full text-xs"
                style={{ 
                  borderLeft: `3px solid ${type.color}`,
                  opacity: filteredRelationshipTypes.includes(type.id) ? 0.5 : 1
                }}
              >
                <span>{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
