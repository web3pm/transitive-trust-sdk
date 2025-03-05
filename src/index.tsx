import React, { useEffect, useState } from "react";
import { TransitiveTrustGraph } from "./TransitiveTrustGraph";
import ReactDOM from "react-dom/client";

function App() {
  const [graphData, setGraphData] = useState<{
    scores: any;
    nodes: string[];
    edges: any[];
  }>({ scores: null, nodes: [], edges: [] });

  useEffect(() => {
    const graph = new TransitiveTrustGraph();

    // Add edges to the graph
    graph.addEdge("A", "B", 0.8, 0.1);
    graph.addEdge("B", "C", 0.6, 0.2);
    graph.addEdge("C", "D", 0.7, 0.3);
    graph.addEdge("A", "C", 0.5, 0.1);
    graph.addEdge("B", "D", 0.4, 0.1);

    // Compute and store all data
    const scores = graph.computeTrustScores("A");
    const nodes = graph.getNodes();
    const edges = graph.getEdges();

    setGraphData({ scores, nodes, edges });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Transitive Trust Graph Example</h1>

      <h2>Trust Scores from Node A:</h2>
      <pre>{JSON.stringify(graphData.scores, null, 2)}</pre>

      <h2>Nodes:</h2>
      <pre>{JSON.stringify(graphData.nodes, null, 2)}</pre>

      <h2>Edges:</h2>
      <pre>{JSON.stringify(graphData.edges, null, 2)}</pre>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
