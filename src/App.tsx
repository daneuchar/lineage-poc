import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from './components/FlowCanvas';
import ColumnLineageCanvas from './components/ColumnLineageCanvas';
import './styles/index.css';
import type { ViewMode } from './types';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('port');
  const [selectedPortForColumns, setSelectedPortForColumns] = useState<string | null>(null);

  const handleViewColumnLineage = (portId: string) => {
    setSelectedPortForColumns(portId);
    setViewMode('column');
  };

  const handleBackToPortView = () => {
    setViewMode('port');
    setSelectedPortForColumns(null);
  };

  return (
    <div className="App">
      <ReactFlowProvider>
        {viewMode === 'port' ? (
          <FlowCanvas onViewColumnLineage={handleViewColumnLineage} />
        ) : (
          <ColumnLineageCanvas initialPortId={selectedPortForColumns} onBack={handleBackToPortView} />
        )}
      </ReactFlowProvider>
    </div>
  );
}

export default App;
