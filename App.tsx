
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { DocCompareTool } from './components/DocCompareTool';
import { SubroArbTool } from './components/SubroArbTool';

type ViewState = 'dashboard' | 'docCompare' | 'subroArb';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const handleNavigate = (view: string) => {
    // Simple routing logic, flexible for future apps
    if (view === 'docCompare') {
      setCurrentView('docCompare');
    } else if (view === 'subroArb') {
      setCurrentView('subroArb');
    } else {
      console.warn(`Unknown view: ${view}`);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      
      {currentView === 'docCompare' && (
        <DocCompareTool onBack={handleBackToDashboard} />
      )}

      {currentView === 'subroArb' && (
        <SubroArbTool onBack={handleBackToDashboard} />
      )}
    </>
  );
};

export default App;
