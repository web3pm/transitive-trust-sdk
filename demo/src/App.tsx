import React, { useState } from "react";
import { TransitiveTrustGraph } from "@ethereum-attestation-service/transitive-trust-sdk";
import "./App.css";

function App() {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");
  const [positiveWeight, setPositiveWeight] = useState(0);
  const [negativeWeight, setNegativeWeight] = useState(0);
  const [results, setResults] = useState<any>(null);

  const graph = new TransitiveTrustGraph();
  graph.addEdge("A", "B", 0.9, 0);
  graph.addEdge("B", "C", 0.1, 0);
  graph.addEdge("C", "D", 0.9, 0);
  graph.addEdge("A", "C", 0.1, 0);
  graph.addEdge("C", "E", 0.9, 0);
  graph.addEdge("B", "F", 0.9, 0);
  graph.addEdge("D", "E", 0.9, 0);
  graph.addEdge("E", "D", 0.9, 0);
  graph.addEdge("D", "C", 0.9, 0);
  graph.addEdge("E", "C", 0.9, 0);
  graph.addEdge("E", "F", 0, 1);
  graph.addEdge("F", "G", 0.9, 0);
  graph.addEdge("G", "C", 0, 0.9);

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
