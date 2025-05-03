import { create } from 'zustand';
import { GraphNode, GraphLink, GraphData } from './types';
import { devtools } from 'zustand/middleware';

// 交互状态接口
interface InteractionState {
  // 变换状态
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  
  // 拖拽状态
  dragging: number | null;
  isDragging: boolean;
  
  // 平移状态
  isPanning: boolean;
  activelyDragging: boolean;
  lastMousePos: { x: number; y: number };
  
  // 交互模式
  interactionMode: 'default' | 'pan' | 'zoom';
  
  // 全屏状态
  isFullscreen: boolean;
}

interface GraphState extends InteractionState {
  // 图数据
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode: number | null;
  
  // 节点操作
  addNode: (node: GraphNode) => void;
  updateNode: (id: number, updates: Partial<GraphNode>) => void;
  updateNodes: (nodes: GraphNode[]) => void;
  removeNode: (id: number) => void;
  
  // 连接操作
  addLink: (link: GraphLink) => void;
  updateLinks: (links: GraphLink[]) => void;
  removeLink: (id: string) => void;
  
  // 选择操作
  setSelectedNode: (id: number | null) => void;
  setInitialData: (data: GraphData) => void;
  
  // 交互状态操作
  setTransform: (transform: { x: number; y: number; scale: number }) => void;
  resetTransform: () => void;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  
  // 拖拽操作
  startNodeDrag: (nodeId: number) => void;
  updateNodePosition: (nodeId: number, x: number, y: number) => void;
  endNodeDrag: (nodeId: number) => void;
  
  // 平移操作
  startPanning: () => void;
  stopPanning: () => void;
  updatePanPosition: (dx: number, dy: number) => void;
  setMousePosition: (x: number, y: number) => void;
  
  // 交互模式
  setInteractionMode: (mode: 'default' | 'pan' | 'zoom') => void;
  
  // 全屏操作
  setFullscreen: (isFullscreen: boolean) => void;
  toggleFullscreen: () => void;
}

// 默认值
const DEFAULT_TRANSFORM = { x: 0, y: 0, scale: 1 };
const DEFAULT_MOUSE_POS = { x: 0, y: 0 };

export const useGraphStore = create<GraphState>()(
  devtools(
    (set) => ({
      // 图数据
      nodes: [],
      links: [],
      selectedNode: null,
      
      // 交互状态
      transform: DEFAULT_TRANSFORM,
      dragging: null,
      isDragging: false,
      isPanning: false,
      activelyDragging: false,
      lastMousePos: DEFAULT_MOUSE_POS,
      interactionMode: 'default',
      isFullscreen: false,
      
      // 节点操作
      addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node]
      }), false, 'addNode'),
      
      updateNode: (id, updates) => set((state) => ({
        nodes: state.nodes.map(node => 
          node.id === id ? { ...node, ...updates } : node
        )
      }), false, 'updateNode'),
      
      updateNodes: (nodes) => set((state) => ({
        // 保留原有节点的所有属性，只更新传入的节点
        nodes: state.nodes.map(existingNode => {
          const updatedNode = nodes.find(n => n.id === existingNode.id);
          return updatedNode ? { ...existingNode, ...updatedNode } : existingNode;
        })
      }), false, 'updateNodes'),
      
      removeNode: (id) => set((state) => ({
        nodes: state.nodes.filter(node => node.id !== id),
        links: state.links.filter(link => 
          link.source !== id && link.target !== id
        )
      }), false, 'removeNode'),
      
      // 连接操作
      addLink: (link) => set((state) => ({
        links: [...state.links, link]
      }), false, 'addLink'),
      
      updateLinks: (links) => set({
        links
      }, false, 'updateLinks'),
      
      removeLink: (id) => set((state) => ({
        links: state.links.filter(link => link.id !== id)
      }), false, 'removeLink'),
      
      // 选择操作
      setSelectedNode: (id) => set({ selectedNode: id }, false, 'setSelectedNode'),
      
      setInitialData: (data) => set({ 
        nodes: data.nodes, 
        links: data.links 
      }, false, 'setInitialData'),
      
      // 交互状态操作
      setTransform: (transform) => set({ 
        transform 
      }, false, 'setTransform'),
      
      resetTransform: () => set({ 
        transform: DEFAULT_TRANSFORM 
      }, false, 'resetTransform'),
      
      zoomIn: (factor = 1.2) => set((state) => ({ 
        transform: {
          ...state.transform,
          scale: Math.min(3, state.transform.scale * factor)
        }
      }), false, 'zoomIn'),
      
      zoomOut: (factor = 1.2) => set((state) => ({ 
        transform: {
          ...state.transform,
          scale: Math.max(0.1, state.transform.scale / factor)
        }
      }), false, 'zoomOut'),
      
      // 拖拽操作
      startNodeDrag: (nodeId) => set({ 
        dragging: nodeId,
        isDragging: true
      }, false, 'startNodeDrag'),
      
      updateNodePosition: (nodeId, x, y) => set((state) => {
        // D3模拟中的节点需要固定坐标fx和fy
        const updatedNodes = state.nodes.map(node => 
          node.id === nodeId 
            ? { ...node, x, y, fx: x, fy: y } 
            : node
        );
        
        return {
          nodes: updatedNodes
        };
      }, false, 'updateNodePosition'),
      
      endNodeDrag: (nodeId) => set((state) => {
        // 释放节点，清除固定坐标
        const updatedNodes = state.nodes.map(node => 
          node.id === nodeId 
            ? { ...node, fx: null, fy: null } 
            : node
        );
        
        return {
          dragging: null,
          isDragging: false,
          nodes: updatedNodes
        };
      }, false, 'endNodeDrag'),
      
      // 平移操作
      startPanning: () => set({ 
        isPanning: true 
      }, false, 'startPanning'),
      
      stopPanning: () => set({ 
        isPanning: false,
        activelyDragging: false
      }, false, 'stopPanning'),
      
      updatePanPosition: (dx, dy) => set((state) => ({ 
        transform: {
          ...state.transform,
          x: state.transform.x + dx,
          y: state.transform.y + dy
        }
      }), false, 'updatePanPosition'),
      
      setMousePosition: (x, y) => set({ 
        lastMousePos: { x, y },
        activelyDragging: true
      }, false, 'setMousePosition'),
      
      // 交互模式
      setInteractionMode: (mode) => set((state) => ({ 
        interactionMode: state.interactionMode === mode ? 'default' : mode 
      }), false, 'setInteractionMode'),
      
      // 全屏操作
      setFullscreen: (isFullscreen) => set({ 
        isFullscreen 
      }, false, 'setFullscreen'),
      
      toggleFullscreen: () => set((state) => ({ 
        isFullscreen: !state.isFullscreen 
      }), false, 'toggleFullscreen'),
    }),
    { name: 'graph-store' }
  )
);

// 自定义hooks，封装相关功能
export function useGraphTransform() {
  const { transform, setTransform, resetTransform, zoomIn, zoomOut } = useGraphStore();
  return { transform, setTransform, resetTransform, zoomIn, zoomOut };
}

export function useGraphDrag() {
  const { 
    dragging, 
    isDragging, 
    startNodeDrag, 
    updateNodePosition, 
    endNodeDrag 
  } = useGraphStore();
  
  return { 
    dragging, 
    isDragging, 
    startNodeDrag, 
    updateNodePosition, 
    endNodeDrag 
  };
}

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
    setInteractionMode
  } = useGraphStore();
  
  return { 
    isPanning, 
    activelyDragging, 
    lastMousePos, 
    interactionMode,
    startPanning, 
    stopPanning, 
    updatePanPosition, 
    setMousePosition,
    setInteractionMode
  };
}
