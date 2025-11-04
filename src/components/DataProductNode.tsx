import { Avatar, Box, Tooltip } from '@mui/material';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useState, useEffect, useMemo, useRef, type MouseEvent } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { DataProductNodeData, Port } from '../types';

function DataProductNode({ id, data }: NodeProps<Record<string, unknown>>) {
  const nodeData = data as DataProductNodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  const [relatedPorts, setRelatedPorts] = useState<string[]>([]); // Track related ports for highlighting
  const [inputPage, setInputPage] = useState(0);
  const [outputPage, setOutputPage] = useState(0);
  const [openMenuPortId, setOpenMenuPortId] = useState<string | null>(null); // Track which port's kebab menu is open

  const ITEMS_PER_PAGE = 5;

  // Use globally selected port from parent (FlowCanvas)
  const selectedPortId = nodeData.selectedPortId;

  const handleToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (nodeData.onToggleExpansion) {
      nodeData.onToggleExpansion();
    }
    // Reset pagination when toggling
    setInputPage(0);
    setOutputPage(0);
  };

  const handleInputClick = (input: Port, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const newSelected = selectedPortId === input.id ? null : input.id;

    if (nodeData.onPortSelect) {
      nodeData.onPortSelect(newSelected);
    }
  };

  const handleOutputClick = (output: Port, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const newSelected = selectedPortId === output.id ? null : output.id;

    if (nodeData.onPortSelect) {
      nodeData.onPortSelect(newSelected);
    }
  };

  const handleInputPageChange = (delta: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setInputPage((prev) => Math.max(0, Math.min(prev + delta, inputTotalPages - 1)));
  };

  const handleOutputPageChange = (delta: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setOutputPage((prev) => Math.max(0, Math.min(prev + delta, outputTotalPages - 1)));
  };

  const handleKebabClick = (portId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setOpenMenuPortId(openMenuPortId === portId ? null : portId);
  };

  const handleViewColumnLineage = (portId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (nodeData.onViewColumnLineage) {
      nodeData.onViewColumnLineage(portId);
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

  const inputs = nodeData.inputs || [];
  const outputs = nodeData.outputs || [];

  // Disable related ports highlighting - only show in-lineage ports (green)
  useEffect(() => {
    // Keep relatedPorts empty to disable yellow highlighting
    setRelatedPorts([]);
  }, [nodeData.lineagePorts, inputs, outputs]);

  // Sort ports so lineage ports appear first - memoized to prevent unnecessary recalculations
  const sortedInputs = useMemo(() => {
    return [...inputs].sort((a, b) => {
      const aIsInLineage = nodeData.lineagePorts && nodeData.lineagePorts.has(a.id);
      const bIsInLineage = nodeData.lineagePorts && nodeData.lineagePorts.has(b.id);
      if (aIsInLineage && !bIsInLineage) return -1;
      if (!aIsInLineage && bIsInLineage) return 1;
      return 0;
    });
  }, [inputs, nodeData.lineagePorts]);

  const sortedOutputs = useMemo(() => {
    return [...outputs].sort((a, b) => {
      const aIsInLineage = nodeData.lineagePorts && nodeData.lineagePorts.has(a.id);
      const bIsInLineage = nodeData.lineagePorts && nodeData.lineagePorts.has(b.id);
      if (aIsInLineage && !bIsInLineage) return -1;
      if (!aIsInLineage && bIsInLineage) return 1;
      return 0;
    });
  }, [outputs, nodeData.lineagePorts]);

  // Calculate pagination
  const inputTotalPages = Math.ceil(sortedInputs.length / ITEMS_PER_PAGE);
  const outputTotalPages = Math.ceil(sortedOutputs.length / ITEMS_PER_PAGE);

  const visibleInputs = sortedInputs.slice(
    inputPage * ITEMS_PER_PAGE,
    (inputPage + 1) * ITEMS_PER_PAGE
  );

  const visibleOutputs = sortedOutputs.slice(
    outputPage * ITEMS_PER_PAGE,
    (outputPage + 1) * ITEMS_PER_PAGE
  );

  // Track previous visible ports to avoid unnecessary updates
  const prevVisiblePortsRef = useRef<{ inputs: string[]; outputs: string[] }>({ inputs: [], outputs: [] });

  // Update React Flow internals and notify parent about visible ports
  useEffect(() => {
    if (nodeData.expanded) {
      // First, update React Flow's internal handle registry
      updateNodeInternals(id);

      // Wait longer for React Flow to fully process and register the handles
      // This delay is critical to prevent "Couldn't create edge" errors
      const timeoutId = setTimeout(() => {
        if (nodeData.onVisiblePortsChange) {
          // Recalculate visible inputs/outputs based on current page
          const currentVisibleInputs = sortedInputs.slice(
            inputPage * ITEMS_PER_PAGE,
            (inputPage + 1) * ITEMS_PER_PAGE
          );
          const currentVisibleOutputs = sortedOutputs.slice(
            outputPage * ITEMS_PER_PAGE,
            (outputPage + 1) * ITEMS_PER_PAGE
          );

          const visibleInputIds = currentVisibleInputs.map((input) => input.id);
          const visibleOutputIds = currentVisibleOutputs.map((output) => output.id);

          // Only call onVisiblePortsChange if the visible ports have actually changed
          const prevInputs = prevVisiblePortsRef.current.inputs;
          const prevOutputs = prevVisiblePortsRef.current.outputs;
          const inputsChanged =
            visibleInputIds.length !== prevInputs.length ||
            visibleInputIds.some((id, i) => id !== prevInputs[i]);
          const outputsChanged =
            visibleOutputIds.length !== prevOutputs.length ||
            visibleOutputIds.some((id, i) => id !== prevOutputs[i]);

          if (inputsChanged || outputsChanged) {
            prevVisiblePortsRef.current = { inputs: visibleInputIds, outputs: visibleOutputIds };
            nodeData.onVisiblePortsChange(visibleInputIds, visibleOutputIds);
          }
        }
      }, 1); // 1ms delay ensures proper execution order

      return () => clearTimeout(timeoutId);
    } else if (!nodeData.expanded && nodeData.onVisiblePortsChange) {
      // When collapsed, clear visible ports immediately - only if they're not already empty
      const prevInputs = prevVisiblePortsRef.current.inputs;
      const prevOutputs = prevVisiblePortsRef.current.outputs;
      if (prevInputs.length > 0 || prevOutputs.length > 0) {
        prevVisiblePortsRef.current = { inputs: [], outputs: [] };
        nodeData.onVisiblePortsChange([], []);
      }
    }
  }, [id, inputPage, outputPage, nodeData.expanded, nodeData.onVisiblePortsChange, updateNodeInternals, sortedInputs, sortedOutputs]);

  return (
    <div
      className={`dataproduct-node ${nodeData.selected ? 'selected' : ''} ${
        nodeData.expanded ? 'expanded' : 'collapsed'
      } ${nodeData.inLineage ? 'in-lineage' : ''}`}
    >
      <Box className="dataproduct-tag">
        <svg
          className="animate-pulse"
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          fill="none"
          viewBox="0 0 12 12"
        >
          <g>
            <circle cx="6" cy="6" r=".8" fill="var(--ubs-white)"></circle>
            <circle
              cx="6"
              cy="6"
              r="5"
              stroke="var(--ubs-white)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.1"
            ></circle>
            <circle
              cx="6"
              cy="6"
              r="2.5"
              stroke="var(--ubs-white)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.1"
            ></circle>
          </g>
        </svg>
        <span>DataProduct</span>
      </Box>
      {!nodeData.expanded ? (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
          <div className="node-content">
            <div className="node-title-row">
              <Tooltip title="Euchar, Daniel" arrow>
                <Avatar className="node-avatar">{nodeData.avatar || 'ED'}</Avatar>
              </Tooltip>
              <div className="title-content">
                <h3>{nodeData.label || 'Data Product'}</h3>
                <div className="port-badges">
                  <span className="port-badge input-badge">
                    <span className="badge-dot"></span>
                    {inputs.length} in
                  </span>
                  <span className="port-badge output-badge">
                    <span className="badge-dot"></span>
                    {outputs.length} out
                  </span>
                </div>
              </div>
            </div>
            <button className="expand-button" onClick={handleToggleClick}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Expand
            </button>
          </div>
        </>
      ) : (
        <>
          <Handle type="target" position={Position.Left} style={{opacity: 0, pointerEvents: 'none'}} />
          <Handle type="source" position={Position.Right} style={{opacity: 0, pointerEvents: 'none'}} />
          <div className="dataproduct-header">
            <div className="header-title-row">
              <Tooltip title="Euchar, Daniel" arrow>
                <Avatar className="node-avatar">{nodeData.avatar || 'ED'}</Avatar>
              </Tooltip>
              <h3>{nodeData.label || 'Data Product'}</h3>
            </div>
            <button className="collapse-button" onClick={handleToggleClick}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M9 7.5L6 4.5L3 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Collapse
            </button>
          </div>
          <div className="dataproduct-ports">
            {/* Input Ports Section */}
            <div className="ports-section input-ports">
              <div className="ports-header">
                Input Ports
                {inputTotalPages > 1 && (
                  <span className="page-indicator">
                    {inputPage + 1}/{inputTotalPages}
                  </span>
                )}
              </div>
              <div className="ports-list">
                {visibleInputs.map((input) => {
                  const isInLineage = nodeData.lineagePorts && nodeData.lineagePorts.has(input.id);
                  const isMenuOpen = openMenuPortId === input.id;
                  return (
                    <div
                      key={input.id}
                      className={`port-item ${selectedPortId === input.id ? 'selected' : ''} ${
                        relatedPorts.includes(input.id) ? 'related' : ''
                      } ${isInLineage ? 'in-lineage' : ''}`}
                      onClick={(e) => handleInputClick(input, e)}
                    >
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={input.id}
                        style={{ left: -5, top: '50%' }}
                      />
                      {/* Internal handle for input port (right side) - for internal edges */}
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`${input.id}-internal`}
                        style={{ right: -5, top: '50%', opacity: 0 }}
                      />
                      <span className="port-label">{input.label}</span>
                      <div className="port-menu-container">
                        <button
                          className="port-kebab-button"
                          onClick={(e) => handleKebabClick(input.id, e)}
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
                              onClick={(e) => handleViewColumnLineage(input.id, e)}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
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
                  );
                })}
              </div>
              {inputTotalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    className="pagination-button"
                    onClick={(e) => handleInputPageChange(-1, e)}
                    disabled={inputPage === 0}
                  >
                    ‹
                  </button>
                  <button
                    className="pagination-button"
                    onClick={(e) => handleInputPageChange(1, e)}
                    disabled={inputPage === inputTotalPages - 1}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Output Ports Section */}
            <div className="ports-section output-ports">
              <div className="ports-header">
                Output Ports
                {outputTotalPages > 1 && (
                  <span className="page-indicator">
                    {outputPage + 1}/{outputTotalPages}
                  </span>
                )}
              </div>
              <div className="ports-list">
                {visibleOutputs.map((output) => {
                  const isInLineage = nodeData.lineagePorts && nodeData.lineagePorts.has(output.id);
                  const isMenuOpen = openMenuPortId === output.id;
                  return (
                    <div
                      key={output.id}
                      className={`port-item ${selectedPortId === output.id ? 'selected' : ''} ${
                        relatedPorts.includes(output.id) ? 'related' : ''
                      } ${isInLineage ? 'in-lineage' : ''}`}
                      onClick={(e) => handleOutputClick(output, e)}
                    >
                      {/* Internal handle for output port (left side) - for internal edges */}
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={`${output.id}-internal`}
                        style={{ left: -5, top: '50%', opacity: 0 }}
                      />
                      <span className="port-label">{output.label}</span>
                      <div className="port-menu-container">
                        <button
                          className="port-kebab-button"
                          onClick={(e) => handleKebabClick(output.id, e)}
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
                              onClick={(e) => handleViewColumnLineage(output.id, e)}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
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
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={output.id}
                        style={{ right: -5, top: '50%' }}
                      />
                    </div>
                  );
                })}
              </div>
              {outputTotalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    className="pagination-button"
                    onClick={(e) => handleOutputPageChange(-1, e)}
                    disabled={outputPage === 0}
                  >
                    ‹
                  </button>
                  <button
                    className="pagination-button"
                    onClick={(e) => handleOutputPageChange(1, e)}
                    disabled={outputPage === outputTotalPages - 1}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DataProductNode;
