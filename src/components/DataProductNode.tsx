import { Avatar, Box, Tooltip } from "@mui/material";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  NodeResizeControl,
} from "@xyflow/react";
import { useState, useEffect, useMemo, useRef, type MouseEvent } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DataProductNodeData, Port } from "../types";
import {
  AccountTree,
  ChevronLeft,
  ChevronRight,
  ExpandLessOutlined,
  ExpandMoreOutlined,
  MoreVert,
} from "@mui/icons-material";

function DataProductNode({ id, data, selected }: NodeProps) {
  const nodeData = data as DataProductNodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  const [relatedPorts, setRelatedPorts] = useState<string[]>([]); // Track related ports for highlighting
  const [inputPage, setInputPage] = useState(0);
  const [outputPage, setOutputPage] = useState(0);
  const [openMenuPortId, setOpenMenuPortId] = useState<string | null>(null); // Track which port's kebab menu is open
  const [availableHeight, setAvailableHeight] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Constants for layout calculations
  const portItemHeight = 41; // Height of each port item in pixels
  const headerHeight = 80; // Height of node header
  const sectionHeaderHeight = 30; // Height of "Input Ports"/"Output Ports" headers
  const portsSectionPadding = 16; // Padding around ports section

  // Calculate max items that can fit in the available space
  const getMaxItemsPerSection = () => {
    if (!nodeData.expanded) return 0;

    // Calculate space available for port items
    const availablePortSpace = Math.max(
      0,
      availableHeight - headerHeight - sectionHeaderHeight - portsSectionPadding
    );

    // Calculate how many items can fit
    const maxItems = Math.floor(availablePortSpace / portItemHeight);
    return Math.max(5, maxItems); // Show at least 3 items per page
  };

  // Setup resize observer
  useEffect(() => {
    if (!nodeRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height !== availableHeight) {
          setAvailableHeight(height);
          // Trigger a single node internal update
          setTimeout(() => {
            updateNodeInternals(id);
          }, 100);
        }
      }
    });

    observer.observe(nodeRef.current);

    return () => {
      observer.disconnect();
    };
  }, [availableHeight, id, updateNodeInternals]);

  // Reset pagination when available height changes
  useEffect(() => {
    if (nodeData.expanded) {
      setInputPage(0);
      setOutputPage(0);
    }
  }, [availableHeight, nodeData.expanded]);

  // Use globally selected port from parent (FlowCanvas)
  const selectedPortId = nodeData.selectedPortId;

  const handleToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (nodeData.onToggleExpansion) {
      nodeData.onToggleExpansion();
    }

    setInputPage(0);
    setOutputPage(0);

    // Single delayed update after expansion state changes
    setTimeout(() => {
      updateNodeInternals(id);
    }, 100);
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

  const handleInputPageChange = (
    delta: number,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setInputPage((prev) =>
      Math.max(0, Math.min(prev + delta, inputTotalPages - 1))
    );
  };

  const handleOutputPageChange = (
    delta: number,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setOutputPage((prev) =>
      Math.max(0, Math.min(prev + delta, outputTotalPages - 1))
    );
  };

  const handleKebabClick = (
    portId: string,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setOpenMenuPortId(openMenuPortId === portId ? null : portId);
  };

  const handleViewColumnLineage = (
    portId: string,
    e: MouseEvent<HTMLButtonElement>
  ) => {
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
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
      const aIsInLineage =
        nodeData.lineagePorts && nodeData.lineagePorts.has(a.id);
      const bIsInLineage =
        nodeData.lineagePorts && nodeData.lineagePorts.has(b.id);
      if (aIsInLineage && !bIsInLineage) return -1;
      if (!aIsInLineage && bIsInLineage) return 1;
      return 0;
    });
  }, [inputs, nodeData.lineagePorts]);

  const sortedOutputs = useMemo(() => {
    return [...outputs].sort((a, b) => {
      const aIsInLineage =
        nodeData.lineagePorts && nodeData.lineagePorts.has(a.id);
      const bIsInLineage =
        nodeData.lineagePorts && nodeData.lineagePorts.has(b.id);
      if (aIsInLineage && !bIsInLineage) return -1;
      if (!aIsInLineage && bIsInLineage) return 1;
      return 0;
    });
  }, [outputs, nodeData.lineagePorts]);

  // Calculate dynamic pagination based on available space
  const itemsPerPage = getMaxItemsPerSection();
  const inputTotalPages = Math.ceil(sortedInputs.length / itemsPerPage);
  const outputTotalPages = Math.ceil(sortedOutputs.length / itemsPerPage);

  const visibleInputs = sortedInputs.slice(
    inputPage * itemsPerPage,
    (inputPage + 1) * itemsPerPage
  );

  const visibleOutputs = sortedOutputs.slice(
    outputPage * itemsPerPage,
    (outputPage + 1) * itemsPerPage
  );

  // Track previous visible ports to avoid unnecessary updates
  const prevVisiblePortsRef = useRef<{ inputs: string[]; outputs: string[] }>({
    inputs: [],
    outputs: [],
  });

  // Update React Flow internals and notify parent about visible ports
  useEffect(() => {
    // Update node internals when expansion state changes
    updateNodeInternals(id);

    // Calculate visible ports
    const visibleInputIds = nodeData.expanded
      ? sortedInputs
          .slice(inputPage * itemsPerPage, (inputPage + 1) * itemsPerPage)
          .map((input) => input.id)
      : [];

    const visibleOutputIds = nodeData.expanded
      ? sortedOutputs
          .slice(outputPage * itemsPerPage, (outputPage + 1) * itemsPerPage)
          .map((output) => output.id)
      : [];

    // Only update if the visible ports have changed
    const prevInputs = prevVisiblePortsRef.current.inputs;
    const prevOutputs = prevVisiblePortsRef.current.outputs;

    const inputsChanged =
      visibleInputIds.length !== prevInputs.length ||
      visibleInputIds.some((id, i) => id !== prevInputs[i]);

    const outputsChanged =
      visibleOutputIds.length !== prevOutputs.length ||
      visibleOutputIds.some((id, i) => id !== prevOutputs[i]);

    if ((inputsChanged || outputsChanged) && nodeData.onVisiblePortsChange) {
      prevVisiblePortsRef.current = {
        inputs: visibleInputIds,
        outputs: visibleOutputIds,
      };
      nodeData.onVisiblePortsChange(visibleInputIds, visibleOutputIds);
    }
  }, [
    id,
    nodeData.expanded,
    inputPage,
    outputPage,
    itemsPerPage,
    sortedInputs,
    sortedOutputs,
    updateNodeInternals,
  ]);

  return (
    <div
      ref={nodeRef}
      className={`dataproduct-node ${nodeData.selected ? "selected" : ""} ${
        nodeData.expanded ? "expanded" : "collapsed"
      } ${nodeData.inLineage ? "in-lineage" : ""}`}
      style={{ height: nodeData.expanded ? "100%" : "auto" }}
    >
      <Box className="dataproduct-tag">DataProduct</Box>
      {!nodeData.expanded ? (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
          <div className="node-content">
            <div className="node-title-row">
              <Tooltip title="Euchar, Daniel" arrow>
                <Avatar className="node-avatar">
                  {nodeData.avatar || "ED"}
                </Avatar>
              </Tooltip>
              <div className="title-content">
                <h3>{nodeData.label || "Data Product"}</h3>
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
              <ExpandMoreOutlined />
              Expand
            </button>
          </div>
        </>
      ) : (
        <>
          {selected && (
            <NodeResizeControl
              minWidth={440}
              minHeight={338}
              position="bottom-right"
            />
          )}
          <Handle
            type="target"
            position={Position.Left}
            style={{ opacity: 0, pointerEvents: "none" }}
          />
          <Handle
            type="source"
            position={Position.Right}
            style={{ opacity: 0, pointerEvents: "none" }}
          />
          <div className="dataproduct-header">
            <div className="header-title-row">
              <Tooltip title="Euchar, Daniel" arrow>
                <Avatar className="node-avatar">
                  {nodeData.avatar || "ED"}
                </Avatar>
              </Tooltip>
              <h3>{nodeData.label || "Data Product"}</h3>
            </div>
            <button className="collapse-button" onClick={handleToggleClick}>
              <ExpandLessOutlined />
              Collapse
            </button>
          </div>
          <div className="dataproduct-ports">
            {/* Input Ports Section */}
            <div className="ports-section input-ports">
              <div className="ports-header">Input Ports</div>
              <div className="ports-list">
                {visibleInputs.map((input) => {
                  const isInLineage =
                    nodeData.lineagePorts &&
                    nodeData.lineagePorts.has(input.id);
                  const isMenuOpen = openMenuPortId === input.id;
                  return (
                    <div
                      key={input.id}
                      className={`port-item ${
                        selectedPortId === input.id ? "selected" : ""
                      } ${relatedPorts.includes(input.id) ? "related" : ""} ${
                        isInLineage ? "in-lineage" : ""
                      }`}
                      onClick={(e) => handleInputClick(input, e)}
                      onMouseEnter={() => nodeData.onPortHover?.(input.id)}
                      onMouseLeave={() => nodeData.onPortHover?.(null)}
                    >
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={input.id}
                        style={{ left: -5, top: "50%" }}
                      />
                      {/* Internal handle for input port (right side) - for internal edges */}
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`${input.id}-internal`}
                        style={{ right: -5, top: "50%" }}
                      />
                      <span className="port-label">{input.label}</span>
                      <div className="port-menu-container">
                        <button
                          className="port-kebab-button"
                          onClick={(e) => handleKebabClick(input.id, e)}
                          title="Port options"
                        >
                          <MoreVert sx={{ fontSize: 16 }} />
                        </button>
                        {isMenuOpen && (
                          <div className="port-menu-dropdown">
                            <button
                              className="port-menu-item"
                              onClick={(e) =>
                                handleViewColumnLineage(input.id, e)
                              }
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
                                <rect
                                  x="10"
                                  y="2"
                                  width="4"
                                  height="4"
                                  rx="1"
                                />
                                <rect
                                  x="10"
                                  y="10"
                                  width="4"
                                  height="4"
                                  rx="1"
                                />
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
                    <ChevronLeft />
                  </button>

                  <span className="page-indicator">
                    {inputPage + 1} of {inputTotalPages}
                  </span>

                  <button
                    className="pagination-button"
                    onClick={(e) => handleInputPageChange(1, e)}
                    disabled={inputPage === inputTotalPages - 1}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>

            {/* Output Ports Section */}
            <div className="ports-section output-ports">
              <div className="ports-header">Output Ports</div>
              <div className="ports-list">
                {visibleOutputs.map((output) => {
                  const isInLineage =
                    nodeData.lineagePorts &&
                    nodeData.lineagePorts.has(output.id);
                  const isMenuOpen = openMenuPortId === output.id;
                  return (
                    <div
                      key={output.id}
                      className={`port-item ${
                        selectedPortId === output.id ? "selected" : ""
                      } ${relatedPorts.includes(output.id) ? "related" : ""} ${
                        isInLineage ? "in-lineage" : ""
                      }`}
                      onClick={(e) => handleOutputClick(output, e)}
                      onMouseEnter={() => nodeData.onPortHover?.(output.id)}
                      onMouseLeave={() => nodeData.onPortHover?.(null)}
                    >
                      {/* Internal handle for output port (left side) - for internal edges */}
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={`${output.id}-internal`}
                        style={{ left: -5, top: "50%" }}
                      />
                      <span className="port-label">{output.label}</span>
                      <div className="port-menu-container">
                        <button
                          className="port-kebab-button"
                          onClick={(e) => handleKebabClick(output.id, e)}
                          title="Port options"
                        >
                          <MoreVert sx={{ fontSize: 16 }} />
                        </button>
                        {isMenuOpen && (
                          <div className="port-menu-dropdown">
                            <button
                              className="port-menu-item"
                              onClick={(e) =>
                                handleViewColumnLineage(output.id, e)
                              }
                            >
                              <AccountTree sx={{ fontSize: 14 }} />
                              View Column Lineage
                            </button>
                          </div>
                        )}
                      </div>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={output.id}
                        style={{ right: -5, top: "50%" }}
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
                    <ChevronLeft />
                  </button>
                  <span className="page-indicator">
                    {outputPage + 1} of {outputTotalPages}
                  </span>
                  <button
                    className="pagination-button"
                    onClick={(e) => handleOutputPageChange(1, e)}
                    disabled={outputPage === outputTotalPages - 1}
                  >
                    <ChevronRight />
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
