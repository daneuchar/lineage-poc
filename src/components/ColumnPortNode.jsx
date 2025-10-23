import { Avatar, Box, Tooltip } from '@mui/material';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useState, useEffect } from 'react';

function ColumnPortNode({ id, data }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [columnPage, setColumnPage] = useState(0);
  const [openMenuPortId, setOpenMenuPortId] = useState(null);

  const ITEMS_PER_PAGE = 5;

  // Use globally selected column from parent
  const selectedColumnId = data.selectedColumnId;

  const handleColumnClick = (column, e) => {
    e.stopPropagation();
    const newSelected = selectedColumnId === column.id ? null : column.id;

    if (data.onColumnSelect) {
      data.onColumnSelect(newSelected);
    }
  };

  const handleColumnPageChange = (delta, e) => {
    e.stopPropagation();
    setColumnPage(prev => Math.max(0, Math.min(prev + delta, totalPages - 1)));
  };

  const handleKebabClick = (e) => {
    e.stopPropagation();
    setOpenMenuPortId(openMenuPortId === data.portId ? null : data.portId);
  };

  const handleViewColumnLineage = (e) => {
    e.stopPropagation();
    if (data.onViewColumnLineage) {
      data.onViewColumnLineage(data.portId);
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

  const columns = data.columns || [];

  // Calculate pagination - use original column order
  const totalPages = Math.ceil(columns.length / ITEMS_PER_PAGE);
  const visibleColumns = columns.slice(
    columnPage * ITEMS_PER_PAGE,
    (columnPage + 1) * ITEMS_PER_PAGE
  );

  // Update React Flow internals when columns change
  // Use timeout to ensure handles are registered before notifying parent
  useEffect(() => {
    updateNodeInternals(id);

    const timeoutId = setTimeout(() => {
      if (data.onVisibleColumnsChange) {
        const visibleColumnIds = visibleColumns.map(col => col.id);
        data.onVisibleColumnsChange(visibleColumnIds);
      }
    }, 1); // 1ms delay ensures proper execution order

    return () => clearTimeout(timeoutId);
  }, [id, columnPage, updateNodeInternals, visibleColumns, data]); // Depend on visibleColumns

  const isSelected = data.selected || false;
  const isInLineage = data.inLineage || false;
  const isMenuOpen = openMenuPortId === data.portId;

  return (
    <div
      className={`column-port-node ${isSelected ? 'selected' : ''} ${isInLineage ? 'in-lineage' : ''}`}
    >
      <div className="column-port-header">
        <div className="port-info">
          <div className="port-title-row">
            <h4 className="port-title">{data.portLabel || 'Port'}</h4>
            <span className={`port-type-badge ${data.portType}`}>
              {data.portType === 'input' ? 'IN' : 'OUT'}
            </span>
          </div>
          <div className="port-subtitle">
            <span className="node-label">{data.nodeLabel}</span>
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
          {visibleColumns.map((column, index) => {
            const isInLineage = data.lineageColumns && data.lineageColumns.has(column.id);
            const isSelected = selectedColumnId === column.id;

            return (
              <div
                key={column.id}
                className={`column-item ${isSelected ? 'selected' : ''} ${isInLineage ? 'in-lineage' : ''}`}
                onClick={(e) => handleColumnClick(column, e)}
              >
                {/* Column handles for column-to-column edges */}
                {data.portType === 'input' && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={column.id}
                    style={{ left: -5, top: '50%' }}
                  />
                )}
                {data.portType === 'output' && (
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
