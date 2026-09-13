import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CallScreen from './pages/CallScreen';
import Sessions from './pages/Sessions';
import VoiceProfiles from './pages/VoiceProfiles';
import { VoIPProvider } from './context/VoIPContext';

const App: React.FC = () => {
  return (
    <VoIPProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="call" element={<CallScreen />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="voice-profiles" element={<VoiceProfiles />} />
        </Route>
      </Routes>
    </VoIPProvider>
  );
};

export default App;
