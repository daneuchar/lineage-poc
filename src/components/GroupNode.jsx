import { Handle, Position } from "@xyflow/react";
import { useState, useEffect, useRef } from "react";

function GroupNode({ data }) {
  const [selectedChild, setSelectedChild] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const visibleChildrenRef = useRef([]);

  const handleChildClick = (childIndex) => {
    const newSelected = selectedChild === childIndex ? null : childIndex;
    setSelectedChild(newSelected);

    // Notify parent component about selection
    if (data.onChildSelect && data.children) {
      const childId =
        newSelected !== null ? data.children[newSelected].id : null;
      data.onChildSelect(childId);
    }
  };

  const handleViewMore = () => {
    setShowAll((prev) => !prev);
  };

  const lastVisibleHandlesRef = useRef([]);

  // Report visible handles to parent
  useEffect(() => {
    if (data.onVisibleHandlesChange && data.children) {
      if (searchQuery) {
        console.log({ searchQuery });
        const keywords = searchQuery.toLowerCase();
        const visibleHandleIds = (data.children || [])
          .filter((child) => child.label.toLowerCase().startsWith(keywords))
          .map((child) => child.id);

        console.log(visibleHandleIds);

        visibleChildrenRef.current = visibleHandleIds;
        data.onVisibleHandlesChange(visibleHandleIds);
        return;
      }

      const visibleHandleIds = data.children
        .filter((_, i) => showAll || i < 3)
        .map((child) => child.id);

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
      <div className="group-node">
        <div className="group-header">
          <h4>Output Ports</h4>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Click Data Product to expand
          </div>
        </div>
      </div>
    );
  }

  const children = data.children || [];
  const visibleChildren = showAll ? children : children.slice(0, 3);
  const hasMore = children.length > 3;

  return (
    <div className="group-node">
      <div className="group-header">
        <h4>Output Ports</h4>
      </div>
      <input
        type="text"
        id={`output-search-${
          data.label?.replace(/\s+/g, "-").toLowerCase() || "default"
        }`}
        name={`output-search-${
          data.label?.replace(/\s+/g, "-").toLowerCase() || "default"
        }`}
        placeholder="Search outputs..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
        className="input-search"
        autoComplete="off"
      />
      <div className="child-items">
        {children.map((child, i) => {
          const isVisible = searchQuery
            ? visibleChildrenRef.current.includes(child.id)
            : showAll || i < 3;
          const isSelected = selectedChild === i;
          return (
            <div
              key={child.id}
              className={`child-item ${isSelected ? "selected" : ""}`}
              onClick={() => handleChildClick(i)}
              style={{
                pointerEvents: isVisible ? "auto" : "none",
                opacity: isVisible ? 1 : 0,
                height: isVisible ? "auto" : "0",
                minHeight: isVisible ? "20px" : "0",
                padding: isVisible ? "4px 8px" : "0 8px",
                marginBottom: isVisible ? "4px" : "0",
                transition: "all 0.2s ease",
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={child.id}
                style={{
                  position: "absolute",
                  left: "-5px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: isVisible ? 1 : 0,
                }}
              />
              <Handle
                type="source"
                position={Position.Right}
                id={child.id}
                style={{
                  position: "absolute",
                  right: "-5px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: isVisible ? 1 : 0,
                }}
              />
              <span>{child.label}</span>
            </div>
          );
        })}
        {hasMore && searchQuery.length === 0 && (
          <div className="view-more-button" onClick={handleViewMore}>
            {showAll ? "▲ View Less" : `▼ View More (${children.length - 3})`}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupNode;
