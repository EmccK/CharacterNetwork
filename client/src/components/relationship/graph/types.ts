import { Character, Relationship, RelationshipType } from "@shared/schema";

export interface GraphNode {
  id: number;
  name: string;
  avatar?: string;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  degree: number;
}

export interface GraphLink {
  source: number;
  target: number;
  type: string;
  color: string;
  id: string;
  typeId: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphProps {
  characters: Character[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  isLoading?: boolean;
  onNodeSelect?: (character: Character | null) => void;
}
