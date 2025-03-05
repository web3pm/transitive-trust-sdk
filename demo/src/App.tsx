import React, { useEffect, useState, useMemo } from "react";
import { TransitiveTrustGraph } from "@ethereum-attestation-service/transitive-trust-sdk";
import GraphVisualization from "./GraphVisualization";
import "./App.css";

function App() {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");
  const [positiveWeight, setPositiveWeight] = useState(0);
  const [negativeWeight, setNegativeWeight] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [edges, setEdges] = useState<
    { from: string; to: string; label: string }[]
  >([]);

  const graph = useMemo(() => {
    const g = new TransitiveTrustGraph();
    g.addEdge("A", "B", 0.9, 0);
    g.addEdge("B", "C", 0.1, 0);
    g.addEdge("C", "D", 0.9, 0);
    g.addEdge("A", "C", 0.1, 0);
    g.addEdge("C", "E", 0.9, 0);
    g.addEdge("B", "F", 0.9, 0);
    g.addEdge("D", "E", 0.9, 0);
    g.addEdge("E", "D", 0.9, 0);
    g.addEdge("D", "C", 0.9, 0);
    g.addEdge("E", "C", 0.9, 0);
    g.addEdge("E", "F", 0, 1);
    g.addEdge("F", "G", 0.9, 0);
    g.addEdge("G", "C", 0, 0.9);
    return g;
  }, []);

  useEffect(() => {
    const allEdges = graph.getEdges().map((edge) => ({
      from: edge.source,
      to: edge.target,
      label: `+${edge.positiveWeight}, -${edge.negativeWeight}`,
    }));
    setEdges(allEdges);
  }, [graph]);

  const handleRecompute = () => {
    if (!sourceNode) return;
    const scores = graph.computeTrustScores(sourceNode);
    setResults(scores);
  };

  const handleUpdateEdge = () => {
    if (!sourceNode || !targetNode) return;
    graph.addEdge(sourceNode, targetNode, positiveWeight, negativeWeight);
    const scores = graph.computeTrustScores(sourceNode);
    setResults(scores);
  };

  return (
    <div className="App">
      <h1>Transitive Trust Graph Demo</h1>
      <div className="inputs-section">
        <h2> Set up graph</h2>

        <input
          placeholder="Source Node"
          value={sourceNode}
          onChange={(e) => setSourceNode(e.target.value)}
        />
        <input
          placeholder="Target Node"
          value={targetNode}
          onChange={(e) => setTargetNode(e.target.value)}
        />
        <input
          type="number"
          placeholder="Positive weight"
          value={positiveWeight}
          onChange={(e) => setPositiveWeight(Number(e.target.value))}
        />
        <input
          type="number"
          placeholder="Negative weight"
          value={negativeWeight}
          onChange={(e) => setNegativeWeight(Number(e.target.value))}
        />
        <button onClick={handleUpdateEdge}>Update edge</button>
      </div>
      <div className="results-section">
        <h2> Display results</h2>
        <input
          placeholder="Source Node"
          value={sourceNode}
          onChange={(e) => setSourceNode(e.target.value)}
        />
        <button onClick={handleRecompute}>Compute Score</button>
      </div>

      <GraphVisualization edges={edges} />

      {results && (
        <div className="results">
          <h2>Trust Scores:</h2>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
