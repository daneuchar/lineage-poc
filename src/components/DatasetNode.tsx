import { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ColumnLineageColumn } from '../types';
import '../styles/dataset-node.css';

export interface DatasetNodeData extends Record<string, unknown> {
  datasetId: string;
  datasetName: string;
  datasetType?: string;
  portType?: 'input' | 'output';
  columns: ColumnLineageColumn[];
  schema?: string;
  tags?: string[];
  onColumnSelect?: (columnId: string | null) => void;
  onVisibleColumnsChange?: (visibleColumnIds: string[]) => void;
  selectedColumnId?: string | null;
  lineageColumns?: Set<string>;
}

// Constants for height calculations
const COLUMN_ITEM_HEIGHT = 40; // Approximate height of each column item including margins
const HEADER_HEIGHT = 80; // Dataset header + tag height
const PAGINATION_HEIGHT = 50; // Pagination controls height
const MIN_COLUMNS_TO_SHOW = 5;
const DEFAULT_COLUMNS_PER_PAGE = 5;

// Calculate minimum height needed to show MIN_COLUMNS_TO_SHOW columns
const MIN_NODE_HEIGHT = HEADER_HEIGHT + (MIN_COLUMNS_TO_SHOW * COLUMN_ITEM_HEIGHT) + PAGINATION_HEIGHT;

export const DatasetNode = ({ data, selected }: NodeProps<DatasetNodeData>) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [nodeHeight, setNodeHeight] = useState<number>(0);

  const totalColumns = data.columns.length;

  // Calculate columns per page based on available height
  const calculateColumnsPerPage = useCallback((height: number): number => {
    if (height === 0) return DEFAULT_COLUMNS_PER_PAGE;

    const availableHeight = height - HEADER_HEIGHT - PAGINATION_HEIGHT;
    const columnsCount = Math.floor(availableHeight / COLUMN_ITEM_HEIGHT);

    // Ensure at least MIN_COLUMNS_TO_SHOW and at most totalColumns
    return Math.max(MIN_COLUMNS_TO_SHOW, Math.min(columnsCount, totalColumns));
  }, [totalColumns]);

  const columnsPerPage = calculateColumnsPerPage(nodeHeight);
  const totalPages = Math.ceil(totalColumns / columnsPerPage);

  // Calculate visible columns based on current page and dynamic columns per page
  const startIndex = (currentPage - 1) * columnsPerPage;
  const endIndex = startIndex + columnsPerPage;
  const visibleColumns = data.columns.slice(startIndex, endIndex);

  // Track node height changes using ResizeObserver
  useEffect(() => {
    if (!nodeRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        setNodeHeight(height);
      }
    });

    resizeObserver.observe(nodeRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Reset to page 1 when columns per page changes (due to resize)
  useEffect(() => {
    // Ensure current page is valid after resize
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [columnsPerPage, currentPage, totalPages]);

  // Notify parent about visible columns when page changes or columns per page changes
  useEffect(() => {
    const visibleColumnIds = visibleColumns.map((col) => col.id);
    data.onVisibleColumnsChange?.(visibleColumnIds);
  }, [currentPage, columnsPerPage, data, visibleColumns]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="dataset-node" ref={nodeRef}>
      {/* Node resizer - shows when node is selected */}
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={380}
        minHeight={MIN_NODE_HEIGHT}
      />

      {/* Flap/folder tag showing port type */}
      <div className={`dataset-tag ${data.portType || 'input'}`}>
        {data.portType === 'output' ? 'OUTPUT' : 'INPUT'}
      </div>

      <div className="dataset-header">
        <div className="dataset-title">{data.datasetName}</div>
        {data.datasetType && (
          <div className="dataset-type">{data.datasetType}</div>
        )}
        {data.schema && (
          <div className="dataset-schema">{data.schema}</div>
        )}
      </div>

      <div className="dataset-columns">
        {visibleColumns.map((col) => {
        const isSelected = data.selectedColumnId === col.id;
        const isInLineage = data.lineageColumns?.has(col.id);
        const hasTags = col.tags && col.tags.length > 0;

          return (
            <div
              key={col.id}
              onClick={() => data.onColumnSelect?.(isSelected ? null : col.id)}
              className={`column-item ${isSelected ? 'selected' : ''} ${isInLineage ? 'in-lineage' : ''}`}
            >
              {/* Target handle for incoming connections (left side) - show if has sourceColumns */}
              {col.sourceColumns && col.sourceColumns.length > 0 && (
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
              )}
              <div className="column-content">
                <div className="column-name-row">
                  <span className="column-name">{col.name}</span>
                  <div className="column-icons">
                    {col.isPrimaryKey && <span className="key-icon">🔑</span>}
                    {col.isForeignKey && <span className="link-icon">🔗</span>}
                  </div>
                </div>
                <span className="column-type">{col.dataType}</span>
              </div>
              {hasTags && (
                <div className="column-tags">
                  {col.tags?.map((tag) => (
                    <span key={tag} className="tag-badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Source handle for outgoing connections (right side) - show if has targetColumns */}
              {col.targetColumns && col.targetColumns.length > 0 && (
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

      {/* Pagination controls - only show if there are more columns than per page */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export const nodeTypes = {
  dataset: DatasetNode,
};
