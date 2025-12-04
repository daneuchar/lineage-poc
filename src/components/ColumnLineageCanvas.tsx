import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node as ReactFlowNode,
  type Edge as ReactFlowEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { mockApi } from '../services/mockApi';
import { getLayoutedNodes } from '../utils/layoutUtils';
import { buildLayoutEdges, buildEdgesFromRelatedColumns, styleEdgesWithLineage } from '../utils/edgeUtils';
import { findColumnLineage, getColumnName } from '../utils/columnLineageUtils';
import { DatasetNode, nodeTypes, type DatasetNodeData } from './DatasetNode';
import type { ColumnLineageData } from '../types';

interface ColumnLineageCanvasProps {
  onBack?: () => void;
}

function ColumnLineageCanvas({ onBack }: ColumnLineageCanvasProps) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode<DatasetNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [lineageColumns, setLineageColumns] = useState<Set<string>>(new Set());
  const [datasetData, setDatasetData] = useState<ColumnLineageData | null>(null);

  // Load dataset column lineage data from API
  useEffect(() => {
    const loadDatasetColumnLineage = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getTableColumnLineage();
        console.log('Dataset column lineage data:', data);
        setDatasetData(data);

        // Build nodes from datasets
        const newNodes: ReactFlowNode<DatasetNodeData>[] = data.datasets.map((dataset) => ({
          id: dataset.id,
          type: 'dataset',
          position: { x: 0, y: 0 }, // Will be calculated by layout
          data: {
            datasetId: dataset.id,
            datasetName: dataset.data.dp_name,
            datasetType: dataset.type,
            portType: dataset.data.port_type,
            columns: dataset.data.columns,
            schema: dataset.data.schema,
            tags: dataset.data.tags,
          },
        }));

        // Build edges from relatedColumns
        const newEdges = buildEdgesFromRelatedColumns(data.datasets);

        // Build layout-only edges (without handles) for Dagre algorithm
        const layoutEdges = buildLayoutEdges(data.datasets);

        // Apply layout using layout-only edges
        const layoutedNodes = await getLayoutedNodes(newNodes as any, layoutEdges, {});
        setNodes(layoutedNodes as any);
        setEdges(newEdges);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDatasetColumnLineage();
  }, [setNodes, setEdges]);

  // Rebuild edges with lineage highlighting
  const rebuildEdges = useCallback(() => {
    if (!datasetData) return;

    const builtEdges = buildEdgesFromRelatedColumns(datasetData.datasets);
    const styledEdges = styleEdgesWithLineage(builtEdges, lineageColumns);
    setEdges(styledEdges);
  }, [datasetData, lineageColumns, setEdges]);

  // Update edges when lineage changes
  useEffect(() => {
    rebuildEdges();
  }, [rebuildEdges]);

  // Fit view after nodes are loaded
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [loading, nodes.length, fitView]);

  // Handle column selection
  const handleColumnSelect = useCallback(
    (columnId: string | null) => {
      setSelectedColumn((prev) => {
        const newSelection = prev === columnId ? null : columnId;

        if (newSelection) {
          const lineage = findColumnLineage(newSelection, datasetData);
          setLineageColumns(lineage);
        } else {
          setLineageColumns(new Set());
        }

        return newSelection;
      });
    },
    [datasetData]
  );

  // Add callbacks to nodes
  const nodesWithCallback = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onColumnSelect: handleColumnSelect,
      selectedColumnId: selectedColumn,
      lineageColumns,
    },
  }));

  const onError = useCallback((code: string, message: string) => {
    // Suppress error #008 (handle not found) during pagination
    // This can happen temporarily while React Flow processes handle updates
    if (code === "008") {
      console.debug(
        "Handle temporarily unavailable during pagination:",
        message
      );
      return;
    }
    // Log other errors normally
    console.error(`React Flow Error ${code}:`, message);
  }, []);

  if (loading) {
    return (
      <div className="column-lineage-container">
        {onBack && (
          <div className="column-lineage-header">
            <button className="back-button" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          </div>
        )}
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
        {onBack && (
          <div className="column-lineage-header">
            <button className="back-button" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          </div>
        )}
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
        {onBack && (
          <button className="back-button" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}
        <h2 className="column-lineage-title">Column Lineage</h2>
        {selectedColumn && datasetData && (
          <div style={{ fontSize: '14px', color: '#6b7280', marginLeft: 'auto' }}>
            Selected: {getColumnName(selectedColumn, datasetData.datasets)} ({lineageColumns.size}{' '}
            columns in lineage)
          </div>
        )}
      </div>
      <div className="column-lineage-canvas">
        <ReactFlow
          nodes={nodesWithCallback}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onError={onError}
          defaultEdgeOptions={{
            type: 'default',
            animated: false,
            style: { strokeWidth: 2 },
          }}
          fitView
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
