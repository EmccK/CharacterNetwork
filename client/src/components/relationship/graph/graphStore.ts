import { create } from 'zustand';
import { GraphNode, GraphLink, GraphData } from './types';

interface GraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode: number | null;
  
  addNode: (node: GraphNode) => void;
  updateNode: (id: number, updates: Partial<GraphNode>) => void;
  updateNodes: (nodes: GraphNode[]) => void;
  removeNode: (id: number) => void;
  
  addLink: (link: GraphLink) => void;
  updateLinks: (links: GraphLink[]) => void;
  removeLink: (id: string) => void;
  
  setSelectedNode: (id: number | null) => void;
  setInitialData: (data: GraphData) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  links: [],
  selectedNode: null,
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    )
  })),
  
  updateNodes: (nodes) => set((state) => ({
    // 保留原有节点的所有属性，只更新传入的节点
    nodes: state.nodes.map(existingNode => {
      const updatedNode = nodes.find(n => n.id === existingNode.id);
      return updatedNode ? { ...existingNode, ...updatedNode } : existingNode;
    })
  })),
  
  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    links: state.links.filter(link => 
      link.source !== id && link.target !== id
    )
  })),
  
  addLink: (link) => set((state) => ({
    links: [...state.links, link]
  })),
  
  updateLinks: (links) => set({
    links
  }),
  
  removeLink: (id) => set((state) => ({
    links: state.links.filter(link => link.id !== id)
  })),
  
  setSelectedNode: (id) => set({ selectedNode: id }),
  
  setInitialData: (data) => set({ 
    nodes: data.nodes, 
    links: data.links 
  }),
}));
