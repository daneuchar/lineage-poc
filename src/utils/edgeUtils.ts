import type { Edge as ReactFlowEdge } from '@xyflow/react';
import type { ColumnLineageTable } from '../types';

/**
 * Build layout-only edges (dataset to dataset, without handles) for Dagre layout algorithm
 * These edges are used purely for calculating the graph layout
 */
export const buildLayoutEdges = (datasets: ColumnLineageTable[]): ReactFlowEdge[] => {
  const datasetConnections = new Set<string>();
  const edges: ReactFlowEdge[] = [];

  datasets.forEach((dataset) => {
    dataset.data.columns.forEach((col) => {
      // Build edges from targetColumns (right edges - outgoing)
      col.targetColumns?.forEach((targetColId) => {
        const targetDataset = datasets.find((d) =>
          d.data.columns.some((c) => c.id === targetColId)
        );

        if (targetDataset) {
          const connectionKey = `${dataset.id}-${targetDataset.id}`;
          if (!datasetConnections.has(connectionKey)) {
            datasetConnections.add(connectionKey);
            edges.push({
              id: connectionKey,
              source: dataset.id,
              target: targetDataset.id,
              type: 'default',
            });
          }
        }
      });
    });
  });

  return edges;
};

/**
 * Build edges from sourceColumns and targetColumns in datasets
 * These edges are the actual visual connections shown in the graph
 */
export const buildEdgesFromRelatedColumns = (datasets: ColumnLineageTable[]): ReactFlowEdge[] => {
  const edges: ReactFlowEdge[] = [];

  datasets.forEach((dataset) => {
    dataset.data.columns.forEach((col) => {
      // Build edges from targetColumns (right edges - outgoing)
      col.targetColumns?.forEach((targetColId) => {
        const targetDataset = datasets.find((d) =>
          d.data.columns.some((c) => c.id === targetColId)
        );

        if (targetDataset) {
          edges.push({
            id: `${col.id}-${targetColId}`,
            source: dataset.id,
            sourceHandle: col.id,
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
};

/**
 * Style edges with lineage highlighting
 * @param edges - The edges to style
 * @param lineageColumns - Set of column IDs in the current lineage
 * @returns Edges with updated styling based on lineage
 */
export const styleEdgesWithLineage = (
  edges: ReactFlowEdge[],
  lineageColumns: Set<string>
): ReactFlowEdge[] => {
  const hasLineage = lineageColumns.size > 0;

  return edges.map((edge) => {
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
};
