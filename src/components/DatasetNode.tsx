import { Handle, Position } from '@xyflow/react';
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

export const DatasetNode = ({ data }: { data: DatasetNodeData }) => (
  <div className="dataset-node">
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
      {data.columns.map((col) => {
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
  </div>
);

export const nodeTypes = {
  dataset: DatasetNode,
};
