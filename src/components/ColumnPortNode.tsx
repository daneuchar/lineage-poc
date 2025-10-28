import { Avatar, Box, Tooltip } from '@mui/material';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useState, useEffect, useMemo, useRef, type MouseEvent } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ColumnPortNodeData, Column } from '../types';

function ColumnPortNode({ id, data }: NodeProps<Record<string, unknown>>) {
  const nodeData = data as ColumnPortNodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  const [columnPage, setColumnPage] = useState(0);
  const [openMenuPortId, setOpenMenuPortId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 5;

  // Use globally selected column from parent
  const selectedColumnId = nodeData.selectedColumnId;

  const handleColumnClick = (column: Column, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const newSelected = selectedColumnId === column.id ? null : column.id;

    if (nodeData.onColumnSelect) {
      nodeData.onColumnSelect(newSelected);
    }
  };

  const handleColumnPageChange = (delta: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setColumnPage((prev) => Math.max(0, Math.min(prev + delta, totalPages - 1)));
  };

  const handleKebabClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setOpenMenuPortId(openMenuPortId === nodeData.portId ? null : nodeData.portId);
  };

  const handleViewColumnLineage = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (nodeData.onViewColumnLineage) {
      nodeData.onViewColumnLineage(nodeData.portId);
    }
    setOpenMenuPortId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuPortId) {
        setOpenMenuPortId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuPortId]);

  const columns = nodeData.columns || [];

  // Calculate pagination - use original column order - memoized
  const totalPages = useMemo(() => Math.ceil(columns.length / ITEMS_PER_PAGE), [columns.length]);

  const visibleColumns = useMemo(() => {
    return columns.slice(
      columnPage * ITEMS_PER_PAGE,
      (columnPage + 1) * ITEMS_PER_PAGE
    );
  }, [columns, columnPage]);

  // Track previous visible columns to avoid unnecessary updates
  const prevVisibleColumnsRef = useRef<string[]>([]);

  // Update React Flow internals when columns change
  // Use timeout to ensure handles are registered before notifying parent
  useEffect(() => {
    updateNodeInternals(id);

    const timeoutId = setTimeout(() => {
      if (nodeData.onVisibleColumnsChange) {
        const visibleColumnIds = visibleColumns.map((col) => col.id);

        // Only call onVisibleColumnsChange if the visible columns have actually changed
        const prevColumns = prevVisibleColumnsRef.current;
        const columnsChanged =
          visibleColumnIds.length !== prevColumns.length ||
          visibleColumnIds.some((colId, i) => colId !== prevColumns[i]);

        if (columnsChanged) {
          prevVisibleColumnsRef.current = visibleColumnIds;
          nodeData.onVisibleColumnsChange(visibleColumnIds);
        }
      }
    }, 1); // 1ms delay ensures proper execution order

    return () => clearTimeout(timeoutId);
  }, [id, columnPage, updateNodeInternals, visibleColumns, nodeData.onVisibleColumnsChange]);

  const isSelected = nodeData.selected || false;
  const isInLineage = nodeData.inLineage || false;
  const isMenuOpen = openMenuPortId === nodeData.portId;

  return (
    <div
      className={`column-port-node ${isSelected ? 'selected' : ''} ${isInLineage ? 'in-lineage' : ''}`}
    >
      <div className="column-port-header">
        <div className="port-info">
          <div className="port-title-row">
            <h4 className="port-title">{nodeData.portLabel || 'Port'}</h4>
            <span className={`port-type-badge ${nodeData.portType}`}>
              {nodeData.portType === 'input' ? 'IN' : 'OUT'}
            </span>
          </div>
          <div className="port-subtitle">
            <span className="node-label">{nodeData.nodeLabel}</span>
            <span className="column-count">{columns.length} columns</span>
          </div>
        </div>
        <div className="port-menu-container">
          <button
            className="port-kebab-button"
            onClick={handleKebabClick}
            title="Port options"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="port-menu-dropdown">
              <button
                className="port-menu-item"
                onClick={handleViewColumnLineage}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="4" height="4" rx="1" />
                  <rect x="10" y="2" width="4" height="4" rx="1" />
                  <rect x="10" y="10" width="4" height="4" rx="1" />
                  <line x1="6" y1="4" x2="10" y2="4" />
                  <line x1="12" y1="6" x2="12" y2="10" />
                </svg>
                View Column Lineage
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="columns-section">
        <div className="columns-list">
          {visibleColumns.map((column) => {
            const isInLineage = nodeData.lineageColumns && nodeData.lineageColumns.has(column.id);
            const isSelected = selectedColumnId === column.id;

            return (
              <div
                key={column.id}
                className={`column-item ${isSelected ? 'selected' : ''} ${isInLineage ? 'in-lineage' : ''}`}
                onClick={(e) => handleColumnClick(column, e)}
              >
                {/* Column handles for column-to-column edges */}
                {nodeData.portType === 'input' && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={column.id}
                    style={{ left: -5, top: '50%' }}
                  />
                )}
                {nodeData.portType === 'output' && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={column.id}
                    style={{ right: -5, top: '50%' }}
                  />
                )}

                <div className="column-info">
                  <div className="column-name-row">
                    <span className="column-name">{column.name}</span>
                    <div className="column-badges">
                      {column.isPrimaryKey && (
                        <Tooltip title="Primary Key" arrow>
                          <span className="column-badge pk-badge">PK</span>
                        </Tooltip>
                      )}
                      {column.nullable && (
                        <Tooltip title="Nullable" arrow>
                          <span className="column-badge nullable-badge">NULL</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="column-meta">
                    <span className="column-type">{column.dataType}</span>
                    {column.description && (
                      <Tooltip title={column.description} arrow>
                        <svg className="info-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="column-pagination">
            <span className="page-indicator">
              {columnPage + 1}/{totalPages}
            </span>
            <div className="pagination-controls">
              <button
                className="pagination-button"
                onClick={(e) => handleColumnPageChange(-1, e)}
                disabled={columnPage === 0}
              >
                ‹
              </button>
              <button
                className="pagination-button"
                onClick={(e) => handleColumnPageChange(1, e)}
                disabled={columnPage === totalPages - 1}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ColumnPortNode;
