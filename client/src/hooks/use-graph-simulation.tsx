import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useGraphStore } from '@/components/relationship/graph/graphStore';
import type { Character } from '@shared/schema';
import type { GraphNode, GraphLink } from '@/components/relationship/graph/types';
import type { RelationshipType } from '@shared/schema';

interface UseGraphSimulationProps {
  characters: Character[];
  relationships: Array<{ id: number; sourceId: number; targetId: number; typeId: number }>;
  relationshipTypes: RelationshipType[];
  dimensions: { width: number; height: number };
}

export function useGraphSimulation({
  characters,
  relationships,
  relationshipTypes,
  dimensions
}: UseGraphSimulationProps) {
  const { 
    setInitialData, 
    updateNodes,
    updateLinks 
  } = useGraphStore();
  
  const simulationRef = useRef<d3.Simulation<GraphNode, d3.SimulationLinkDatum<GraphNode>> | null>(null);
  const [isSimulationReady, setIsSimulationReady] = useState(false);

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
    // 无论角色是否为空，都需要重建模拟，以处理角色被删除的情况
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

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
      avatar: character.avatar || undefined,
      color: getNodeColor(character.id),
      degree: nodeDegrees.get(character.id) || 0,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 100,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 100
    }));

    // 创建连接
    const graphLinks: GraphLink[] = relationships.map((relationship, index) => {
      const relType = relationshipTypes.find(type => type.id === relationship.typeId);
      const link = {
        source: relationship.sourceId,
        target: relationship.targetId,
        type: relType?.name || "未知",
        color: relType?.color || "#94a3b8",
        id: relationship.id ? `rel-${relationship.id}` : `rel-${index}-${relationship.sourceId}-${relationship.targetId}`,
        typeId: relationship.typeId
      };
      
      console.log('创建 GraphLink:', {
        originalRelationship: relationship,
        createdLink: link,
        relType
      });
      
      return link;
    });

    console.log('useGraphSimulation 设置初始数据:', {
      graphNodes,
      graphLinks,
      relationships,
      relationshipTypes
    });

    // 设置初始数据
    setInitialData({
      nodes: graphNodes,
      links: []  // 先设置为空，在模拟初始化时再设置
    });

    // 初始化模拟
    if (graphNodes.length > 0) {
      initializeSimulation(graphNodes, graphLinks);
    } else {
      // 如果没有节点，清理模拟
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      setIsSimulationReady(false);
    }
  }, [characters, relationships, relationshipTypes, dimensions, getNodeColor, setInitialData]);

  // 初始化D3模拟
  const initializeSimulation = useCallback((graphNodes: GraphNode[], graphLinks: GraphLink[]) => {
    // 停止现有模拟
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    
    // 如果没有节点，直接返回
    if (!graphNodes.length) {
      setIsSimulationReady(false);
      return;
    }

    // 创建力导向图模拟
    try {
      // 确保所有链接中的source和target在节点列表中存在
      const validLinks = graphLinks.filter(link => {
        const sourceExists = graphNodes.some(node => node.id === link.source);
        const targetExists = graphNodes.some(node => node.id === link.target);
        return sourceExists && targetExists;
      });



      const simulation = d3.forceSimulation<GraphNode>()
        .nodes(graphNodes)
        .force('charge', d3.forceManyBody().strength(-150))
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
        .force('collision', d3.forceCollide().radius(30))
        .alpha(1)
        .alphaDecay(0.02);

      // 单独设置链接力，确保正确初始化
      if (validLinks.length > 0) {
        simulation.force('link', d3.forceLink<GraphNode, any>(validLinks)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.5));
      }

      // 确保links数据正确更新到store
      updateLinks(validLinks);

      simulation.on('tick', () => {
        // 更新所有节点位置
        const updatedNodes = simulation.nodes();
        updateNodes(updatedNodes);
      });

      simulationRef.current = simulation;
      setIsSimulationReady(true);
    } catch (error) {
      console.error("D3模拟初始化失败:", error);
      setIsSimulationReady(false);
    }
  }, [dimensions, updateNodes]);

  // 获取模拟状态参考和控制方法
  const startSimulation = useCallback((alpha: number = 0.3) => {
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(alpha).restart();
    }
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0);
    }
  }, []);

  // 更新节点位置
  const updateNodePosition = useCallback((nodeId: number, x: number, y: number) => {
    if (!simulationRef.current) return;
    
    const node = simulationRef.current.nodes().find((n: any) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
      simulationRef.current.alpha(0.3).restart();
    }
  }, []);

  // 释放节点
  const releaseNode = useCallback((nodeId: number) => {
    if (!simulationRef.current) return;
    
    const node = simulationRef.current.nodes().find((n: any) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
      simulationRef.current.alphaTarget(0);
    }
  }, []);

  return {
    simulation: simulationRef.current,
    isSimulationReady,
    startSimulation,
    stopSimulation,
    updateNodePosition,
    releaseNode
  };
}
