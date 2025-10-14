import { Avatar, Box, Divider, Tooltip } from '@mui/material';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useState, useEffect } from 'react';

function DataProductNode({ id, data }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [relatedPorts, setRelatedPorts] = useState([]); // Track related ports for highlighting
  const [inputPage, setInputPage] = useState(0);
  const [outputPage, setOutputPage] = useState(0);

  const ITEMS_PER_PAGE = 5;

  // Use globally selected port from parent (FlowCanvas)
  const selectedPortId = data.selectedPortId;

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (data.onToggleExpansion) {
      data.onToggleExpansion();
    }
    // Reset pagination when toggling
    setInputPage(0);
    setOutputPage(0);
  };

  const handleInputClick = (input, e) => {
    e.stopPropagation();
    const newSelected = selectedPortId === input.id ? null : input.id;

    if (data.onPortSelect) {
      data.onPortSelect(newSelected);
    }
  };

  const handleOutputClick = (output, e) => {
    e.stopPropagation();
    const newSelected = selectedPortId === output.id ? null : output.id;

    if (data.onPortSelect) {
      data.onPortSelect(newSelected);
    }
  };

  const handleInputPageChange = (delta, e) => {
    e.stopPropagation();
    setInputPage(prev => Math.max(0, Math.min(prev + delta, inputTotalPages - 1)));
  };

  const handleOutputPageChange = (delta, e) => {
    e.stopPropagation();
    setOutputPage(prev => Math.max(0, Math.min(prev + delta, outputTotalPages - 1)));
  };

  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  // Disable related ports highlighting - only show in-lineage ports (green)
  useEffect(() => {
    // Keep relatedPorts empty to disable yellow highlighting
    setRelatedPorts([]);
  }, [data.lineagePorts, inputs, outputs]);

  // Sort ports so lineage ports appear first
  const sortedInputs = [...inputs].sort((a, b) => {
    const aIsInLineage = data.lineagePorts && data.lineagePorts.has(a.id);
    const bIsInLineage = data.lineagePorts && data.lineagePorts.has(b.id);
    if (aIsInLineage && !bIsInLineage) return -1;
    if (!aIsInLineage && bIsInLineage) return 1;
    return 0;
  });

  const sortedOutputs = [...outputs].sort((a, b) => {
    const aIsInLineage = data.lineagePorts && data.lineagePorts.has(a.id);
    const bIsInLineage = data.lineagePorts && data.lineagePorts.has(b.id);
    if (aIsInLineage && !bIsInLineage) return -1;
    if (!aIsInLineage && bIsInLineage) return 1;
    return 0;
  });

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

  // Update React Flow internals and notify parent about visible ports
  useEffect(() => {
    if (data.expanded) {
      // First, update React Flow's internal handle registry
      updateNodeInternals(id);

      // Wait longer for React Flow to fully process and register the handles
      // This delay is critical to prevent "Couldn't create edge" errors
      const timeoutId = setTimeout(() => {
        if (data.onVisiblePortsChange) {
          // Recalculate visible inputs/outputs based on current page
          const currentVisibleInputs = sortedInputs.slice(
            inputPage * ITEMS_PER_PAGE,
            (inputPage + 1) * ITEMS_PER_PAGE
          );
          const currentVisibleOutputs = sortedOutputs.slice(
            outputPage * ITEMS_PER_PAGE,
            (outputPage + 1) * ITEMS_PER_PAGE
          );

          const visibleInputIds = currentVisibleInputs.map(input => input.id);
          const visibleOutputIds = currentVisibleOutputs.map(output => output.id);
          data.onVisiblePortsChange(visibleInputIds, visibleOutputIds);
        }
      }, 1); // 1ms delay ensures proper execution order

      return () => clearTimeout(timeoutId);
    } else if (!data.expanded && data.onVisiblePortsChange) {
      // When collapsed, clear visible ports immediately
      data.onVisiblePortsChange([], []);
    }
  }, [id, inputPage, outputPage, data.expanded, updateNodeInternals, data.lineagePorts]);

  return (
    <div
      className={`dataproduct-node ${data.selected ? 'selected' : ''} ${data.expanded ? 'expanded' : 'collapsed'} ${data.inLineage ? 'in-lineage' : ''}`}
    >
      <Box className="dataproduct-tag">
        <svg className="animate-pulse" xmlns="http://www.w3.org/2000/svg" width="8" height="8" fill="none" viewBox="0 0 12 12"><g><circle cx="6" cy="6" r=".8" fill="var(--ubs-white)"></circle><circle cx="6" cy="6" r="5" stroke="var(--ubs-white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1"></circle><circle cx="6" cy="6" r="2.5" stroke="var(--ubs-white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1"></circle></g></svg>
        <span>DataProduct</span>
      </Box>
      {!data.expanded ? (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
          <div className="node-content">
            <div className="node-title-row">
              <Tooltip title="Euchar, Daniel" arrow>
                <Avatar className="node-avatar">{data.avatar || 'ED'}</Avatar>
              </Tooltip>
              <div className="title-content">
                <h3>{data.label || 'Data Product'}</h3>
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
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Expand
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="dataproduct-header">
            <div className="header-title-row">
              <Tooltip title="Euchar, Daniel" arrow>
                <Avatar className="node-avatar">{data.avatar || 'ED'}</Avatar>
              </Tooltip>
              <h3>{data.label || 'Data Product'}</h3>
            </div>
            <button className="collapse-button" onClick={handleToggleClick}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 7.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                {visibleInputs.map((input, index) => {
                  const isInLineage = data.lineagePorts && data.lineagePorts.has(input.id);
                  return (
                  <div
                    key={input.id}
                    className={`port-item ${selectedPortId === input.id ? 'selected' : ''} ${relatedPorts.includes(input.id) ? 'related' : ''} ${isInLineage ? 'in-lineage' : ''}`}
                    onClick={(e) => handleInputClick(input, e)}
                  >
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={input.id}
                      style={{ left: -5, top: '50%' }}
                    />
                    <span className="port-label">{input.label}</span>
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
                {visibleOutputs.map((output, index) => {
                  const isInLineage = data.lineagePorts && data.lineagePorts.has(output.id);
                  return (
                  <div
                    key={output.id}
                    className={`port-item ${selectedPortId === output.id ? 'selected' : ''} ${relatedPorts.includes(output.id) ? 'related' : ''} ${isInLineage ? 'in-lineage' : ''}`}
                    onClick={(e) => handleOutputClick(output, e)}
                  >
                    <span className="port-label">{output.label}</span>
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