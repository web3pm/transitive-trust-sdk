import React, { useEffect, useState, useMemo, useCallback } from "react";
import { TransitiveTrustGraph } from "@ethereum-attestation-service/transitive-trust-sdk";
import GraphVisualization from "./GraphVisualization";
import "./App.css";

function App() {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");
  const [referenceNode, setReferenceNode] = useState("A");
  const [positiveWeight, setPositiveWeight] = useState(0);
  const [negativeWeight, setNegativeWeight] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [edges, setEdges] = useState<
    { from: string; to: string; label: string }[]
  >([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

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

  const memoizedEdges = useMemo(() => {
    const allEdges = graph.getEdges().map((edge) => ({
      from: edge.source,
      to: edge.target,
      label: `+${edge.positiveWeight}, -${edge.negativeWeight}`,
    }));
    return allEdges;
  }, [graph]);

  useEffect(() => {
    setEdges(memoizedEdges);
  }, [memoizedEdges]);

  const handleRecompute = () => {
    if (!referenceNode) return;
    const scores = graph.computeTrustScores(referenceNode);
    setResults(scores);
  };

  const handleUpdateEdge = () => {
    if (!sourceNode || !targetNode) return;

    const existingEdges = graph.getEdges();
    const edgeExists = existingEdges.some(
      (edge) => edge.source === sourceNode && edge.target === targetNode
    );

    if (edgeExists) {
      setToast({
        message: `Edge from ${sourceNode} to ${targetNode} already exists`,
        visible: true,
      });

      setTimeout(() => {
        setToast({ message: "", visible: false });
      }, 3000);

      return;
    }

    graph.addEdge(sourceNode, targetNode, positiveWeight, negativeWeight);

    if (referenceNode) {
      const scores = graph.computeTrustScores(referenceNode);
      setResults(scores);
    }

    setToast({
      message: `Edge from ${sourceNode} to ${targetNode} added`,
      visible: true,
    });

    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 3000);
  };

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setReferenceNode(nodeId);

      const scores = graph.computeTrustScores(nodeId);
      setResults(scores);

      setToast({
        message: `Reference node set to ${nodeId}`,
        visible: true,
      });

      setTimeout(() => {
        setToast({ message: "", visible: false });
      }, 3000);
    },
    [graph]
  );

  return (
    <div className="App">
      <h1>Transitive Trust Graph Demo</h1>

      {toast.visible && (
        <div className="toast-notification">{toast.message}</div>
      )}

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
        <button onClick={handleUpdateEdge}>Add new edge</button>
      </div>
      <div className="results-section">
        <h2> Trust results</h2>
        <input
          placeholder="Reference Node"
          value={referenceNode}
          onChange={(e) => setReferenceNode(e.target.value)}
        />
        <button onClick={handleRecompute}>Compute Score</button>
      </div>

      <GraphVisualization edges={edges} onNodeClick={handleNodeClick} />

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
