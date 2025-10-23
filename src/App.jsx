import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import FlowCanvas from './components/FlowCanvas'
import ColumnLineageCanvas from './components/ColumnLineageCanvas'
import './styles/index.css'

function App() {
  const [viewMode, setViewMode] = useState('port'); // 'port' | 'column'
  const [selectedPortForColumns, setSelectedPortForColumns] = useState(null);

  const handleViewColumnLineage = (portId) => {
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
          <ColumnLineageCanvas
            initialPortId={selectedPortForColumns}
            onBack={handleBackToPortView}
          />
        )}
      </ReactFlowProvider>
    </div>
  )
}

export default App
