import type { ColumnLineageData, ColumnLineageTable } from '../types';

/**
 * Find complete lineage for a column (upstream + downstream)
 * Traverses both sourceColumns (upstream) and targetColumns (downstream)
 * @param columnId - The column ID to find lineage for
 * @param datasetData - The complete dataset data
 * @returns Set of column IDs in the lineage
 */
export const findColumnLineage = (
  columnId: string,
  datasetData: ColumnLineageData | null
): Set<string> => {
  if (!datasetData) return new Set();

  const lineage = new Set<string>();
  const visited = new Set<string>();

  const traverse = (colId: string) => {
    if (visited.has(colId)) return;
    visited.add(colId);
    lineage.add(colId);

    // Find downstream (via targetColumns)
    datasetData.datasets.forEach((dataset) => {
      dataset.data.columns.forEach((col) => {
        if (col.id === colId && col.targetColumns) {
          col.targetColumns.forEach(traverse);
        }
      });
    });

    // Find upstream (via sourceColumns)
    datasetData.datasets.forEach((dataset) => {
      dataset.data.columns.forEach((col) => {
        if (col.id === colId && col.sourceColumns) {
          col.sourceColumns.forEach(traverse);
        }
      });
    });
  };

  traverse(columnId);
  return lineage;
};

/**
 * Find dataset ID for a given column ID
 * @param columnId - The column ID to search for
 * @param datasetData - The complete dataset data
 * @returns The dataset ID or null if not found
 */
export const getDatasetIdForColumn = (
  columnId: string,
  datasetData: ColumnLineageData | null
): string | null => {
  if (!datasetData) return null;

  for (const dataset of datasetData.datasets) {
    if (dataset.data.columns.some((col) => col.id === columnId)) {
      return dataset.id;
    }
  }
  return null;
};

/**
 * Get column name for display in format "dataset.column"
 * @param columnId - The column ID
 * @param datasets - Array of dataset tables
 * @returns Formatted column name or the column ID if not found
 */
export const getColumnName = (
  columnId: string,
  datasets: ColumnLineageTable[]
): string => {
  for (const dataset of datasets) {
    const column = dataset.data.columns.find((col) => col.id === columnId);
    if (column) {
      return `${dataset.data.dp_name}.${column.name}`;
    }
  }
  return columnId;
};
