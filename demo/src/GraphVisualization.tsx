// src/GraphVisualization.tsx
import React, { useEffect, useRef } from "react";
import { Network } from "vis-network";

interface GraphVisualizationProps {
  edges: { from: string; to: string; label: string }[];
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const nodes = new Set<string>();
      edges.forEach((edge) => {
        nodes.add(edge.from);
        nodes.add(edge.to);
      });

      const data = {
        nodes: Array.from(nodes).map((node) => ({ id: node, label: node })),
        edges: edges.map((edge) => ({
          from: edge.from,
          to: edge.to,
          label: edge.label,
        })),
      };

      const options = {
        edges: {
          arrows: {
            to: { enabled: true, scaleFactor: 1 },
          },
        },
        physics: {
          enabled: true,
        },
      };

      new Network(containerRef.current, data, options);
    }
  }, [edges]);

  return <div ref={containerRef} style={{ height: "500px" }} />;
};

export default GraphVisualization;
