import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  type Node as ReactFlowNode,
  type Edge as ReactFlowEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { mockApi } from '../services/mockApi';
import { getLayoutedNodes } from '../utils/layoutUtils';
import type {
  ColumnLineageData,
  ColumnLineageTable,
  ColumnLineageColumn,
} from '../types';

// Simple dataset node component (inline for now)
interface DatasetNodeData extends Record<string, unknown> {
  datasetId: string;
  datasetName: string;
  datasetType?: string;
  columns: ColumnLineageColumn[];
  schema?: string;
  tags?: string[];
  onColumnSelect?: (columnId: string | null) => void;
  onVisibleColumnsChange?: (visibleColumnIds: string[]) => void;
  selectedColumnId?: string | null;
  lineageColumns?: Set<string>;
}

const DatasetNode = ({ data }: { data: DatasetNodeData }) => (
  <div
    style={{
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      minWidth: '280px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}
  >
    <div
      style={{
        fontWeight: 600,
        marginBottom: '4px',
        fontSize: '14px',
        color: '#1f2937',
      }}
    >
      {data.datasetName}
    </div>
    {data.datasetType && (
      <div
        style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '8px',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        {data.datasetType}
      </div>
    )}
    {data.schema && (
      <div
        style={{
          fontSize: '10px',
          color: '#9ca3af',
          marginBottom: '8px',
          fontFamily: 'monospace',
        }}
      >
        {data.schema}
      </div>
    )}
    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
      {data.columns.map((col) => {
        const isSelected = data.selectedColumnId === col.id;
        const isInLineage = data.lineageColumns?.has(col.id);
        const hasTags = col.tags && col.tags.length > 0;

        return (
          <div
            key={col.id}
            onClick={() => data.onColumnSelect?.(isSelected ? null : col.id)}
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '4px',
              marginBottom: '3px',
              background: isSelected
                ? '#a78bfa'
                : isInLineage
                ? '#86efac'
                : '#f9fafb',
              color: isSelected || isInLineage ? 'white' : '#374151',
              border: `1px solid ${
                isSelected ? '#7c3aed' : isInLineage ? '#22c55e' : '#e5e7eb'
              }`,
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isSelected && !isInLineage) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !isInLineage) {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
          >
            {/* Target handle for incoming connections (left side) */}
            <Handle
              type="target"
              position={Position.Left}
              id={col.id}
              style={{
                width: '8px',
                height: '8px',
                background: '#6b7280',
                border: '2px solid white',
                left: '-4px',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 500 }}>{col.name}</span>
                {col.isPrimaryKey && (
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>🔑</span>
                )}
                {col.isForeignKey && (
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>🔗</span>
                )}
              </div>
              <span
                style={{
                  opacity: 0.7,
                  fontSize: '10px',
                  fontFamily: 'monospace',
                }}
              >
                {col.dataType}
              </span>
            </div>
            {hasTags && (
              <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                {col.tags?.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      marginRight: '4px',
                      padding: '1px 4px',
                      background: isSelected || isInLineage ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                      borderRadius: '2px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Source handle for outgoing connections (right side) */}
            {col.relatedColumns && col.relatedColumns.length > 0 && (
              <Handle
                type="source"
                position={Position.Right}
                id={col.id}
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#6b7280',
                  border: '2px solid white',
                  right: '-4px',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const nodeTypes = {
  dataset: DatasetNode,
};

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

  // Helper function to find dataset ID for a column ID
  const getDatasetIdForColumn = useCallback(
    (columnId: string): string | null => {
      if (!datasetData) return null;

      for (const dataset of datasetData.datasets) {
        if (dataset.data.columns.some((col) => col.id === columnId)) {
          return dataset.id;
        }
      }
      return null;
    },
    [datasetData]
  );

  // Build layout-only edges (dataset to dataset, without handles) for Dagre layout algorithm
  const buildLayoutEdges = useCallback((datasets: ColumnLineageTable[]): ReactFlowEdge[] => {
    const datasetConnections = new Set<string>();
    const edges: ReactFlowEdge[] = [];

    datasets.forEach((sourceDataset) => {
      sourceDataset.data.columns.forEach((sourceCol) => {
        sourceCol.relatedColumns?.forEach((targetColId) => {
          // Find target dataset
          const targetDataset = datasets.find((d) =>
            d.data.columns.some((col) => col.id === targetColId)
          );

          if (targetDataset) {
            const connectionKey = `${sourceDataset.id}-${targetDataset.id}`;
            // Only add one edge per dataset pair for layout
            if (!datasetConnections.has(connectionKey)) {
              datasetConnections.add(connectionKey);
              edges.push({
                id: connectionKey,
                source: sourceDataset.id,
                target: targetDataset.id,
                type: 'default',
              });
            }
          }
        });
      });
    });

    return edges;
  }, []);

  // Build edges from relatedColumns in datasets
  const buildEdgesFromRelatedColumns = useCallback((datasets: ColumnLineageTable[]): ReactFlowEdge[] => {
    const edges: ReactFlowEdge[] = [];

    datasets.forEach((sourceDataset) => {
      sourceDataset.data.columns.forEach((sourceCol) => {
        sourceCol.relatedColumns?.forEach((targetColId) => {
          // Find target dataset
          const targetDataset = datasets.find((d) =>
            d.data.columns.some((col) => col.id === targetColId)
          );

          if (targetDataset) {
            edges.push({
              id: `${sourceCol.id}-${targetColId}`,
              source: sourceDataset.id,
              sourceHandle: sourceCol.id,
              target: targetDataset.id,
              targetHandle: targetColId,
              type: 'default',
              style: { strokeWidth: 2, stroke: '#9ca3af' },
            });
          }
        });
      });
    });

    return edges;
  }, []);

  // Find complete lineage for a column (upstream + downstream)
  const findColumnLineage = useCallback(
    (columnId: string): Set<string> => {
      if (!datasetData) return new Set();

      const lineage = new Set<string>();
      const visited = new Set<string>();

      const traverse = (colId: string) => {
        if (visited.has(colId)) return;
        visited.add(colId);
        lineage.add(colId);

        // Find downstream (via relatedColumns)
        datasetData.datasets.forEach((dataset) => {
          dataset.data.columns.forEach((col) => {
            if (col.id === colId && col.relatedColumns) {
              col.relatedColumns.forEach(traverse);
            }
          });
        });

        // Find upstream (columns that have this column in their relatedColumns)
        datasetData.datasets.forEach((dataset) => {
          dataset.data.columns.forEach((col) => {
            if (col.relatedColumns?.includes(colId)) {
              traverse(col.id);
            }
          });
        });
      };

      traverse(columnId);
      return lineage;
    },
    [datasetData]
  );

  // Rebuild edges with lineage highlighting
  const rebuildEdges = useCallback(() => {
    if (!datasetData) return;

    const builtEdges = buildEdgesFromRelatedColumns(datasetData.datasets);
    const hasLineage = lineageColumns.size > 0;

    const styledEdges = builtEdges.map((edge) => {
      // Check if this edge is in the lineage
      const sourceColId = edge.sourceHandle as string;
      const targetColId = edge.targetHandle as string;
      const isInLineage =
        lineageColumns.has(sourceColId) && lineageColumns.has(targetColId);

      return {
        ...edge,
        style: {
          strokeWidth: isInLineage ? 3 : 2,
          stroke: isInLineage ? '#3b82f6' : '#9ca3af',
          opacity: !hasLineage ? 1 : isInLineage ? 1 : 0.2,
        },
        animated: false,
      };
    });

    setEdges(styledEdges);
  }, [datasetData, lineageColumns, buildEdgesFromRelatedColumns, setEdges]);

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
          const lineage = findColumnLineage(newSelection);
          setLineageColumns(lineage);
        } else {
          setLineageColumns(new Set());
        }

        return newSelection;
      });
    },
    [findColumnLineage]
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

// Helper to get column name for display
function getColumnName(columnId: string, datasets: ColumnLineageTable[]): string {
  for (const dataset of datasets) {
    const column = dataset.data.columns.find((col) => col.id === columnId);
    if (column) {
      return `${dataset.data.dp_name}.${column.name}`;
    }
  }
  return columnId;
}

export default ColumnLineageCanvas;
