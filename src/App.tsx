import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Campaigns from './pages/Campaigns';
import './App.css';

// Import the error boundary fix
import './components/AnalyticsErrorBoundary';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
        
        {/* Routes */}
        <Routes>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<Campaigns />} />
          {/* Add other routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;