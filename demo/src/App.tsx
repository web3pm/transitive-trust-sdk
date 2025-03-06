import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { TransitiveTrustGraph } from "@ethereum-attestation-service/transitive-trust-sdk";
import GraphVisualization from "./GraphVisualization";
import "./App.css";
import ReactDOM from "react-dom";

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [graphVersion, setGraphVersion] = useState(0);

  const getEdgeColor = (netScore: number) => {
    if (netScore > 0) {
      const intensity = Math.min(netScore, 1);
      return `rgba(0, ${Math.round(intensity * 180)}, 0, 0.8)`;
    } else if (netScore < 0) {
      const intensity = Math.min(Math.abs(netScore), 1);
      return `rgba(${Math.round(intensity * 220)}, 0, 0, 0.8)`;
    }
    return `rgba(200, 200, 200, 0.8)`;
  };

  const memoizedEdges = useMemo(() => {
    const allEdges = graph.getEdges().map((edge) => ({
      from: edge.source,
      to: edge.target,
      label: "",
      netScore: edge.positiveWeight - edge.negativeWeight,
      color: getEdgeColor(edge.positiveWeight - edge.negativeWeight),
    }));
    return allEdges;
  }, [graph, graphVersion]);

  useEffect(() => {
    setEdges(memoizedEdges);
  }, [memoizedEdges]);

  type TrustScoreMap = {
    [target: string]: {
      positiveScore: number;
      negativeScore: number;
      netScore: number;
    };
  };

  const sortTrustScores = useCallback(
    (scores: TrustScoreMap): TrustScoreMap => {
      const sortedScoresEntries = Object.entries(scores).sort(
        ([, scoreA], [, scoreB]) => scoreB.netScore - scoreA.netScore
      );
      return Object.fromEntries(sortedScoresEntries);
    },
    []
  );

  const handleRecompute = () => {
    if (!referenceNode) return;
    const scores = graph.computeTrustScores(referenceNode);

    const sortedScores = sortTrustScores(scores);

    setResults(sortedScores);
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

    setGraphVersion((prev) => prev + 1);

    if (referenceNode) {
      const scores = graph.computeTrustScores(referenceNode);
      // Sort scores by netScore (descending)
      const sortedScores = sortTrustScores(scores);
      setResults(sortedScores);
    }

    setToast({
      message: `Edge from ${sourceNode} to ${targetNode} added`,
      visible: true,
    });

    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 3000);
  };

  const handleExportCSV = () => {
    const graphEdges = graph.getEdges();

    const csvContent = [
      "Source,Target,PositiveWeight,NegativeWeight",
      ...graphEdges.map(
        (edge) =>
          `${edge.source},${edge.target},${edge.positiveWeight},${edge.negativeWeight}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", "trust_graph_edges.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      message: "CSV file downloaded successfully",
      visible: true,
    });

    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 3000);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) {
          throw new Error("Failed to read file content");
        }

        const lines = csvContent.split("\n");

        const header = lines[0].trim().toLowerCase();
        if (
          !header.includes("source") ||
          !header.includes("target") ||
          !header.includes("positiveweight") ||
          !header.includes("negativeweight")
        ) {
          throw new Error(
            "Invalid CSV format. Header must contain Source, Target, PositiveWeight, and NegativeWeight columns"
          );
        }

        const newGraph = new TransitiveTrustGraph();

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",");
          if (values.length < 4) continue;

          const source = values[0].trim();
          const target = values[1].trim();
          const positiveWeight = parseFloat(values[2].trim());
          const negativeWeight = parseFloat(values[3].trim());

          if (isNaN(positiveWeight) || isNaN(negativeWeight)) {
            continue;
          }

          newGraph.addEdge(source, target, positiveWeight, negativeWeight);
        }

        Object.assign(graph, newGraph);

        const newEdges = newGraph.getEdges().map((edge) => ({
          from: edge.source,
          to: edge.target,
          label: `+${edge.positiveWeight}, -${edge.negativeWeight}`,
        }));

        setEdges(newEdges);

        setGraphVersion((prev) => prev + 1);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setToast({
          message: "Graph successfully imported from CSV",
          visible: true,
        });

        setTimeout(() => {
          setToast({ message: "", visible: false });
        }, 3000);

        const allNodes = new Set([
          ...newEdges.map((e) => e.from),
          ...newEdges.map((e) => e.to),
        ]);

        if (allNodes.has(referenceNode)) {
          const scores = newGraph.computeTrustScores(referenceNode);
          // Sort scores by netScore (descending)
          const sortedScores = sortTrustScores(scores);
          setResults(sortedScores);
        } else if (allNodes.size > 0) {
          const firstNode = Array.from(allNodes)[0];
          setReferenceNode(firstNode);
          const scores = newGraph.computeTrustScores(firstNode);
          // Sort scores by netScore (descending)
          const sortedScores = sortTrustScores(scores);
          setResults(sortedScores);
        }
      } catch (error) {
        console.error("Error importing CSV:", error);
        setToast({
          message:
            error instanceof Error ? error.message : "Error importing CSV file",
          visible: true,
        });

        setTimeout(() => {
          setToast({ message: "", visible: false });
        }, 3000);
      }
    };

    reader.readAsText(file);
  };

  const handleImportButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      // Use batch updates to minimize renders
      ReactDOM.flushSync(() => {
        setReferenceNode(nodeId);
        const scores = graph.computeTrustScores(nodeId);
        // Sort scores by netScore (descending)
        const sortedScores = sortTrustScores(scores);
        setResults(sortedScores);
      });

      // Separated toast logic to prevent cascading re-renders when toast disappears
      if (nodeId) {
        setToast({
          message: `Reference node set to ${nodeId}`,
          visible: true,
        });

        // Use a custom timer ref to manage toast without triggering cascading re-renders
        const timerId = setTimeout(() => {
          setToast((prevToast) => ({
            ...prevToast,
            visible: false,
          }));
        }, 3000);

        // Store timer reference to clean it up if needed
        return () => clearTimeout(timerId);
      }
    },
    [graph, sortTrustScores]
  );

  const memoizedGetNodeColor = useCallback(getEdgeColor, []);

  const memoizedVisualization = useMemo(() => {
    return (
      <GraphVisualization
        edges={memoizedEdges}
        onNodeClick={handleNodeClick}
        trustScores={results}
        getNodeColor={memoizedGetNodeColor}
      />
    );
  }, [
    memoizedEdges,
    handleNodeClick,
    results,
    memoizedGetNodeColor,
    graphVersion,
  ]);

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
        <button onClick={handleExportCSV} className="export-button">
          Export to CSV
        </button>
        <button onClick={handleImportButtonClick} className="import-button">
          Import from CSV
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportCSV}
          accept=".csv"
          style={{ display: "none" }}
        />
      </div>

      {memoizedVisualization}

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
