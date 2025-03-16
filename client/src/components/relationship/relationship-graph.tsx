import { useEffect, useRef, useState } from "react";
import { Character, Relationship, RelationshipType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ZoomIn, ZoomOut, RefreshCw, Download } from "lucide-react";

interface RelationshipGraphProps {
  characters: Character[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  isLoading?: boolean;
}

interface Node {
  id: number;
  name: string;
  avatar?: string;
  x: number;
  y: number;
  color: string;
}

interface Edge {
  source: number;
  target: number;
  type: string;
  color: string;
}

export default function RelationshipGraph({
  characters,
  relationships,
  relationshipTypes,
  isLoading = false
}: RelationshipGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<number | null>(null);
  const [tooltipNode, setTooltipNode] = useState<Node | null>(null);

  // Generate random colors for nodes
  const getNodeColor = (index: number) => {
    const colors = [
      "#4F46E5", // Indigo
      "#EF4444", // Red
      "#10B981", // Green
      "#F59E0B", // Amber
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#06B6D4", // Cyan
    ];
    return colors[index % colors.length];
  };

  // Initialize graph data when characters and relationships change
  useEffect(() => {
    if (isLoading || !characters.length) return;

    // Create nodes (characters)
    const graphNodes = characters.map((character, index) => {
      // Calculate positions in a circle
      const angle = (2 * Math.PI * index) / characters.length;
      const radius = 150;
      const x = 200 + radius * Math.cos(angle);
      const y = 200 + radius * Math.sin(angle);

      return {
        id: character.id,
        name: character.name,
        avatar: character.avatar,
        x,
        y,
        color: getNodeColor(index),
      };
    });

    // Create edges (relationships)
    const graphEdges = relationships.map((relationship) => {
      const relType = relationshipTypes.find(type => type.id === relationship.typeId);
      return {
        source: relationship.sourceId,
        target: relationship.targetId,
        type: relType?.name || "Unknown",
        color: relType?.color || "#94a3b8",
      };
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [characters, relationships, relationshipTypes, isLoading]);

  // Handle mouse events for dragging nodes
  const handleMouseDown = (nodeId: number) => {
    setIsDragging(true);
    setDraggedNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || draggedNodeId === null) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setNodes(prev => 
      prev.map(node => 
        node.id === draggedNodeId 
          ? { ...node, x, y }
          : node
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  // Reset graph positions
  const handleReset = () => {
    setNodes(prev => 
      prev.map((node, index) => {
        const angle = (2 * Math.PI * index) / prev.length;
        const radius = 150;
        const x = 200 + radius * Math.cos(angle);
        const y = 200 + radius * Math.sin(angle);
        return { ...node, x, y };
      })
    );
    setScale(1);
  };

  // Zoom in/out functionality
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Export graph as SVG
  const handleExport = () => {
    if (!containerRef.current) return;

    const svgData = containerRef.current.innerHTML;
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'character-relationship-graph.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (isLoading) {
    return (
      <div className="network-graph flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div 
        ref={containerRef}
        className="network-graph"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        {/* Draw edges (relationships) first so they're behind nodes */}
        {edges.map((edge, index) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);

          if (!source || !target) return null;

          // Calculate edge position and rotation
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const length = Math.sqrt(dx * dx + dy * dy);

          // Position the edge label
          const labelX = source.x + dx/2;
          const labelY = source.y + dy/2 - 10;

          return (
            <div key={`edge-${index}`}>
              {/* Edge line */}
              <div
                className="edge"
                style={{
                  left: `${source.x + 30}px`,
                  top: `${source.y + 30}px`,
                  width: `${length - 60}px`,
                  transform: `rotate(${angle}deg)`,
                  backgroundColor: edge.color,
                }}
              />

              {/* Edge label */}
              <div
                className="edge-label"
                style={{
                  left: `${labelX}px`,
                  top: `${labelY}px`,
                }}
              >
                {edge.type}
              </div>
            </div>
          );
        })}

        {/* Draw nodes (characters) */}
        {nodes.map((node) => (
          <div key={`node-${node.id}`}>
            {/* Character node */}
            <div
              className="node"
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                backgroundColor: node.color,
                cursor: isDragging && draggedNodeId === node.id ? 'grabbing' : 'grab',
              }}
              onMouseDown={() => handleMouseDown(node.id)}
              onMouseEnter={() => setTooltipNode(node)}
              onMouseLeave={() => setTooltipNode(null)}
            >
              {node.avatar ? (
                <img 
                  src={node.avatar} 
                  alt={node.name}
                  className="w-full h-full object-cover rounded-full"
                  draggable={false}
                />
              ) : (
                node.name.substring(0, 2).toUpperCase()
              )}
            </div>

            {/* Tooltip */}
            {tooltipNode && tooltipNode.id === node.id && (
              <div
                className="node-tooltip"
                style={{
                  left: `${node.x + 70}px`,
                  top: `${node.y}px`,
                  opacity: 1,
                }}
              >
                <div className="font-medium">{node.name}</div>
                <div className="text-xs text-gray-500">角色</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend & Controls */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">关系类型</h4>
          <div className="flex flex-wrap gap-2">
            {relationshipTypes.map((type) => (
              <div key={type.id} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-xs text-gray-600">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">图表控制</h4>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-3 w-3 mr-1" /> 放大
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-3 w-3 mr-1" /> 缩小
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReset}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> 重置
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-3 w-3 mr-1" /> 导出
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
