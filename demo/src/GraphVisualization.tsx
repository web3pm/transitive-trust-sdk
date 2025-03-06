// src/GraphVisualization.tsx
import React, { useEffect, useRef } from "react";
import { Network, Node, Edge, Options } from "vis-network";
import { DataSet } from "vis-data";

interface GraphVisualizationProps {
  edges: {
    from: string;
    to: string;
    label: string;
    netScore?: number;
    color?: string;
  }[];
  onNodeClick: (nodeId: string) => void;
  trustScores?: {
    [target: string]: {
      positiveScore: number;
      negativeScore: number;
      netScore: number;
    };
  };
  getNodeColor?: (netScore: number) => string;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  edges,
  onNodeClick,
  trustScores,
  getNodeColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const dataRef = useRef<{ edges: Edge[]; nodes: Node[] } | undefined>(
    undefined
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const nodeIds = new Set<string>();
    edges.forEach((edge) => {
      nodeIds.add(edge.from);
      nodeIds.add(edge.to);
    });

    const nodes = Array.from(nodeIds).map((id) => {
      const nodeScore = trustScores?.[id]?.netScore;
      const borderColor =
        nodeScore !== undefined && getNodeColor
          ? getNodeColor(nodeScore)
          : "#2B7CE9";

      const scoreText =
        nodeScore !== undefined ? `\n(${nodeScore.toFixed(2)})` : "";

      let title = "";
      if (trustScores && trustScores[id]) {
        const { positiveScore, negativeScore, netScore } = trustScores[id];
        title = `Positive Score: ${positiveScore.toFixed(
          2
        )}\nNegative Score: ${negativeScore.toFixed(
          2
        )}\nNet Score: ${netScore.toFixed(2)}`;
      }

      const baseSize = 25;

      return {
        id,
        label: id + scoreText,
        title: title,
        size: baseSize,
        font: {
          size: 16,
          color: "#000000",
          face: "arial",
          align: "center",
          vadjust: -25,
          multi: "html",
        },
        color: {
          background: "#D2E5FF",
          border: borderColor,
          highlight: {
            border: borderColor,
            background: "#EFFFEF",
          },
        },
        borderWidth: Math.max(3, Math.abs(nodeScore || 0) * 5),
      };
    });

    const formattedEdges = edges.map((edge, index) => ({
      id: `e${index}`,
      from: edge.from,
      to: edge.to,
      color: edge.color || "#848484",
      width: 2,
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
    }));

    const nodesDataset = new DataSet<Node>(nodes);
    const edgesDataset = new DataSet<Edge>(formattedEdges);

    const hasStructuralChanges =
      !dataRef.current ||
      dataRef.current.edges.length !== formattedEdges.length ||
      dataRef.current.nodes.length !== nodes.length ||
      nodeIds.size !== nodes.length;

    if (hasStructuralChanges || !networkRef.current) {
      dataRef.current = { nodes, edges: formattedEdges };

      const data = {
        nodes: nodesDataset,
        edges: edgesDataset,
      };

      const options: Options = {
        nodes: {
          shape: "circle",
          size: undefined,
          font: {
            vadjust: -25,
          },
        },
        edges: {
          smooth: {
            enabled: true,
            type: "continuous",
            forceDirection: "none",
            roundness: 0.5,
          },
        },
        physics: {
          stabilization: true,
          barnesHut: {
            gravitationalConstant: -5000,
            springConstant: 0.001,
            springLength: 150,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
        },
      };

      if (networkRef.current) {
        networkRef.current.destroy();
      }

      networkRef.current = new Network(containerRef.current, data, options);

      networkRef.current.on("click", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          onNodeClick(nodeId as string);
        }
      });
    } else if (networkRef.current) {
      nodes.forEach((node) => {
        nodesDataset.update(node);
      });

      formattedEdges.forEach((edge, index) => {
        const edgeWithId = {
          ...edge,
          id: `e${index}`,
        };
        edgesDataset.update(edgeWithId);
      });

      dataRef.current = { nodes, edges: formattedEdges };
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [edges, onNodeClick, trustScores, getNodeColor]);

  return <div ref={containerRef} style={{ height: "600px", width: "100%" }} />;
};

export default GraphVisualization;
