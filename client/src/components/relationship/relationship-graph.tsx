import React from "react";
import { Character, Relationship, RelationshipType } from "@shared/schema";
import GraphVisualization from "./graph";

interface RelationshipGraphProps {
  characters: Character[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  isLoading?: boolean;
}

export default function RelationshipGraph({
  characters,
  relationships,
  relationshipTypes,
  isLoading = false
}: RelationshipGraphProps) {
  return (
    <GraphVisualization
      characters={characters}
      relationships={relationships}
      relationshipTypes={relationshipTypes}
      isLoading={isLoading}
    />
  );
}
