// src/GraphVisualization.tsx
import React, { useEffect, useRef } from "react";
import { Network } from "vis-network";

interface GraphVisualizationProps {
  edges: { from: string; to: string; label: string }[];
  onNodeClick: (nodeId: string) => void;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  edges,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

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
        nodes: {
          shape: "dot",
          size: 16,
          font: {
            size: 14,
          },
          borderWidth: 2,
          shadow: true,
        },
      };

      if (networkRef.current) {
        networkRef.current.destroy();
      }

      networkRef.current = new Network(containerRef.current, data, options);

      if (onNodeClick) {
        networkRef.current.on("click", function (params) {
          if (params.nodes && params.nodes.length > 0) {
            onNodeClick(params.nodes[0]);
          }
        });
      }
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [edges, onNodeClick]);

  return <div ref={containerRef} style={{ height: "500px" }} />;
};

export default React.memo(GraphVisualization);
