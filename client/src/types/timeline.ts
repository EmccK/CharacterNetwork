export interface TimelineEvent {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  importance: string;
  characterIds: number[];
  novelId: number;
  createdAt: string;
}

export interface Character {
  id: number;
  name: string;
  avatar?: string | null;
}

export interface Relationship {
  id: number;
  sourceId: number;
  targetId: number;
  typeId: number;
  description?: string | null;
}

export interface EventRelation {
  sourceEventId: number;
  targetEventId: number;
  relationType: 'causes' | 'follows' | 'parallel';
  description?: string;
}

export interface RelationshipType {
  id: number;
  name: string;
  color: string;
  userId: number;
}
