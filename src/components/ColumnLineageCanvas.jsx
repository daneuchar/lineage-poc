import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ColumnPortNode from "./ColumnPortNode";
import { mockApi } from "../services/mockApi";
import { findCompleteColumnLineage } from "../utils/columnLineageUtils";
import { getLayoutedNodes } from "../utils/layoutUtils";

const nodeTypes = {
  columnport: ColumnPortNode,
};

function ColumnLineageCanvas({ initialPortId, onBack }) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [lineage, setLineage] = useState({ columns: new Set(), edges: new Set(), ports: new Set() });
  const [columnData, setColumnData] = useState(null); // Store all column data
  const [visibleColumns, setVisibleColumns] = useState({}); // Track visible columns per node

  // Load column lineage data from API
  useEffect(() => {
    const loadColumnLineage = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getColumnLineage(initialPortId);

        setColumnData(data);

        // Build nodes for 3-layer graph: Upstream → Selected → Downstream
        const newNodes = [];

        // Upstream ports (left column)
        (data.upstreamPorts || []).forEach((port) => {
          newNodes.push({
            id: port.portId,
            type: "columnport",
            position: { x: 0, y: 0 }, // Will be calculated by Dagre
            data: {
              portId: port.portId,
              portLabel: port.portLabel,
              nodeId: port.nodeId,
              nodeLabel: port.nodeLabel,
              columns: port.columns,
              portType: "output",
            },
          });
        });

        // Selected port (center)
        newNodes.push({
          id: data.selectedPort.portId,
          type: "columnport",
          position: { x: 0, y: 0 }, // Will be calculated by Dagre
          data: {
            portId: data.selectedPort.portId,
            portLabel: data.selectedPort.portLabel,
            nodeId: data.selectedPort.nodeId,
            nodeLabel: data.selectedPort.nodeLabel,
            columns: data.selectedPort.columns,
            portType: data.selectedPort.portId.includes('input') ? "input" : "output",
            selected: true,
          },
        });

        // Downstream ports (right column)
        (data.downstreamPorts || []).forEach((port) => {
          newNodes.push({
            id: port.portId,
            type: "columnport",
            position: { x: 0, y: 0 }, // Will be calculated by Dagre
            data: {
              portId: port.portId,
              portLabel: port.portLabel,
              nodeId: port.nodeId,
              nodeLabel: port.nodeLabel,
              columns: port.columns,
              portType: "input",
            },
          });
        });

        // Build edges for layout calculation
        // Create simple edges from column relationships
        const layoutEdges = [];
        data.columnRelationships.forEach((rel, index) => {
          const sourcePortId = getPortIdForColumnInData(rel.sourceColumn, data);
          const targetPortId = getPortIdForColumnInData(rel.targetColumn, data);

          if (sourcePortId && targetPortId) {
            layoutEdges.push({
              id: `layout-edge-${index}`,
              source: sourcePortId,
              target: targetPortId,
            });
          }
        });

        // Apply Dagre layout
        const layoutedNodes = await getLayoutedNodes(newNodes, layoutEdges, {});
        setNodes(layoutedNodes);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadColumnLineage();
  }, [initialPortId, setNodes]);

  // Fit view after nodes are loaded
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      // Small delay to ensure nodes are rendered
      const timeoutId = setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [loading, nodes.length, fitView]);

  // Helper function to find port ID for a column ID during initial load
  const getPortIdForColumnInData = (columnId, data) => {
    if (!data) return null;

    const allPorts = [
      data.selectedPort,
      ...(data.upstreamPorts || []),
      ...(data.downstreamPorts || []),
    ];

    for (const port of allPorts) {
      if (port.columns.some(col => col.id === columnId)) {
        return port.portId;
      }
    }
    return null;
  };

  // Build edges from column relationships - following FlowCanvas pattern
  const buildEdgesFromRelationships = useCallback(() => {
    if (!columnData) return [];

    const builtEdges = [];

    columnData.columnRelationships.forEach((rel, index) => {
      // Find which nodes these columns belong to
      const sourceNodeId = getPortIdForColumn(rel.sourceColumn, columnData);
      const targetNodeId = getPortIdForColumn(rel.targetColumn, columnData);

      if (!sourceNodeId || !targetNodeId) return;

      // Check if both columns are visible in their respective nodes
      const sourceVisibleCols = visibleColumns[sourceNodeId];
      const targetVisibleCols = visibleColumns[targetNodeId];

      // Only create edge if both columns are visible
      // If a node hasn't reported visible columns yet (undefined), assume visible (initial load)
      const sourceVisible = sourceVisibleCols === undefined || sourceVisibleCols.includes(rel.sourceColumn);
      const targetVisible = targetVisibleCols === undefined || targetVisibleCols.includes(rel.targetColumn);

      if (sourceVisible && targetVisible) {
        builtEdges.push({
          id: `col-edge-${index}`,
          source: sourceNodeId,
          sourceHandle: rel.sourceColumn,
          target: targetNodeId,
          targetHandle: rel.targetColumn,
          type: "default",
          style: { strokeWidth: 2, stroke: "#9ca3af" },
        });
      }
    });

    return builtEdges;
  }, [columnData, visibleColumns]);

  // Helper function to find port ID for a column ID
  const getPortIdForColumn = (columnId, data) => {
    if (!data) return null;

    const allPorts = [
      data.selectedPort,
      ...(data.upstreamPorts || []),
      ...(data.downstreamPorts || []),
    ];

    for (const port of allPorts) {
      if (port.columns.some(col => col.id === columnId)) {
        return port.portId;
      }
    }
    return null;
  };

  // Update edges whenever visible columns change
  // Use debounce to ensure all handles are registered before building edges
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newEdges = buildEdgesFromRelationships();
      setEdges(newEdges);
    }, 1); 

    return () => clearTimeout(timeoutId);
  }, [buildEdgesFromRelationships, setEdges]);

  // Handle column selection
  const handleColumnSelect = useCallback((columnId) => {
    setSelectedColumn((prev) => {
      const newSelection = prev === columnId ? null : columnId;

      // Calculate lineage for the selected column
      if (newSelection && columnData) {
        const allPorts = {
          selectedPort: columnData.selectedPort,
          upstreamPorts: columnData.upstreamPorts,
          downstreamPorts: columnData.downstreamPorts,
        };
        const lineageData = findCompleteColumnLineage(newSelection, columnData.columnRelationships, allPorts);
        setLineage(lineageData);
      } else {
        // Clear lineage when deselecting
        setLineage({ columns: new Set(), edges: new Set(), ports: new Set() });
      }

      return newSelection;
    });
  }, [columnData]);

  // Handle visible columns change (for pagination)
  const handleVisibleColumnsChange = useCallback((nodeId, visibleColumnIds) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [nodeId]: visibleColumnIds,
    }));
  }, []);

  // Suppress handle-related errors during pagination transitions
  const onError = useCallback((code, message) => {
    // Suppress error #008 (handle not found) during pagination
    // This can happen temporarily while React Flow processes handle updates
    if (code === '008') {
      console.debug('Handle temporarily unavailable during pagination:', message);
      return;
    }
    // Log other errors normally
    console.error(`React Flow Error ${code}:`, message);
  }, []);

  // Handle switching to different port's column lineage
  const handleViewColumnLineage = useCallback((portId) => {
    if (portId !== initialPortId) {
      // Reload with new port ID
      window.location.hash = `#column-lineage/${portId}`;
      window.location.reload(); // Simple reload for now
    }
  }, [initialPortId]);

  // Add callbacks to nodes
  const nodesWithCallback = nodes.map((node) => {
    const inLineage = lineage.ports.has(node.id);
    return {
      ...node,
      data: {
        ...node.data,
        onColumnSelect: handleColumnSelect,
        onVisibleColumnsChange: (visibleColumnIds) => handleVisibleColumnsChange(node.id, visibleColumnIds),
        onViewColumnLineage: handleViewColumnLineage,
        selectedColumnId: selectedColumn,
        lineageColumns: lineage.columns,
        inLineage,
      },
    };
  });

  // Style edges based on lineage and sort so lineage edges render on top
  const styledEdges = edges
    .map((edge) => {
      const isInLineage = lineage.edges.has(edge.id);
      const hasLineage = lineage.edges.size > 0;

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isInLineage ? "#3b82f6" : "#9ca3af",
          strokeWidth: isInLineage ? 3 : 2,
          opacity: !hasLineage ? 1 : isInLineage ? 1 : 0.2,
        },
        animated: false,
        isInLineage, // Add flag for sorting
      };
    })
    .sort((a, b) => {
      // Sort so lineage edges render last (on top)
      if (a.isInLineage && !b.isInLineage) return 1;
      if (!a.isInLineage && b.isInLineage) return -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="column-lineage-container">
        <div className="column-lineage-header">
          <button className="back-button" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-text">Loading column lineage...</div>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="column-lineage-container">
        <div className="column-lineage-header">
          <button className="back-button" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="error-container">
          <div className="error-content">
            <div className="error-title">Error loading column lineage</div>
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="column-lineage-container">
      <div className="column-lineage-header">
        <button className="back-button" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h2 className="column-lineage-title">Column Lineage</h2>
      </div>
      <div className="column-lineage-canvas">
        <ReactFlow
          nodes={nodesWithCallback}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onError={onError}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'default',
            animated: false,
            style: { strokeWidth: 2 },
          }}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default ColumnLineageCanvas;
