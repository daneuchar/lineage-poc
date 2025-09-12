import { Handle, Position } from "@xyflow/react";
import { useState, useEffect, useRef } from "react";

function InputGroupNode({ data }) {
  const [selectedInput, setSelectedInput] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const visibleInputsRef = useRef([]);

  const handleInputClick = (inputIndex) => {
    const newSelected = selectedInput === inputIndex ? null : inputIndex;
    setSelectedInput(newSelected);

    if (data.onInputSelect && data.inputs) {
      const inputId = newSelected !== null ? data.inputs[newSelected].id : null;
      data.onInputSelect(inputId);
    }
  };

  const handleViewMore = () => {
    setShowAll((prev) => !prev);
  };

  const lastVisibleHandlesRef = useRef([]);

  // Report visible handles to parent
  useEffect(() => {
    if (data.onVisibleHandlesChange && data.inputs) {
      if (searchQuery) {
        const keywords = searchQuery.toLowerCase();
        const visibleHandleIds = (data.inputs || [])
          .filter((input) => input.label.toLowerCase().startsWith(keywords))
          .map((input) => input.id);

        visibleInputsRef.current = visibleHandleIds;
        data.onVisibleHandlesChange(visibleHandleIds);
        return;
      }

      const visibleHandleIds = data.inputs
        .filter((_, i) => showAll || i < 3)
        .map((input) => input.id);

      // Only call if handles actually changed
      const handleIdsStr = visibleHandleIds.join(",");
      const lastHandleIdsStr = lastVisibleHandlesRef.current.join(",");

      if (handleIdsStr !== lastHandleIdsStr) {
        lastVisibleHandlesRef.current = visibleHandleIds;
        data.onVisibleHandlesChange(visibleHandleIds);
      }
    }
  }, [showAll, searchQuery]);

  if (!data.expanded) {
    return (
      <div className="input-group-node">
        <div className="group-header">
          <h4>Input Ports</h4>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Click Data Product to expand
          </div>
        </div>
      </div>
    );
  }

  const inputs = data.inputs || [];
  const visibleInputs = showAll ? inputs : inputs.slice(0, 3);
  const hasMore = inputs.length > 3;

  return (
    <div className="input-group-node">
      <div className="group-header">
        <h4>Input Ports</h4>
      </div>
      <input
        type="text"
        id={`input-search-${data.label?.replace(/\s+/g, '-').toLowerCase() || 'default'}`}
        name={`input-search-${data.label?.replace(/\s+/g, '-').toLowerCase() || 'default'}`}
        placeholder="Search inputs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input-search"
        autoComplete="off"
      />
      <div className="input-items">
        {inputs.map((input, i) => {
          const isVisible = searchQuery
            ? visibleInputsRef.current.includes(input.id)
            : showAll || i < 3;
          const isSelected = selectedInput === i;
          return (
            <div
              key={input.id}
              className={`input-item ${isSelected ? "selected" : ""} ${isVisible ? "visible" : "hidden"}`}
              onClick={() => handleInputClick(i)}
            >
              <span>{input.label}</span>
              {/* Target handle for incoming edges from DP1 outputs */}
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                className={`handle-left ${isVisible ? "handle-visible" : "handle-hidden"}`}
              />
              {/* Source handle for outgoing edges to DP2 */}
              <Handle
                type="source"
                position={Position.Right}
                id={input.id}
                className={`handle-right ${isVisible ? "handle-visible" : "handle-hidden"}`}
              />
            </div>
          );
        })}
        {hasMore && searchQuery.length === 0 && (
          <div className="view-more-button" onClick={handleViewMore}>
            {showAll ? "▲ View Less" : `▼ View More (${inputs.length - 3})`}
          </div>
        )}
      </div>
    </div>
  );
}

export default InputGroupNode;
