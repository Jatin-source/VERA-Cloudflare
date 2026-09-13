import React, { createContext, useContext } from 'react';
import { useVoIPSignaling } from '../hooks/useVoIPSignaling';

export type VoIPContextType = ReturnType<typeof useVoIPSignaling>;

const VoIPContext = createContext<VoIPContextType | null>(null);

export const VoIPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const voip = useVoIPSignaling();

  return (
    <VoIPContext.Provider value={voip}>
      {children}
    </VoIPContext.Provider>
  );
};

export const useVoIP = (): VoIPContextType => {
  const context = useContext(VoIPContext);
  if (!context) {
    throw new Error('useVoIP must be used within a VoIPProvider');
  }
  return context;
};

export default VoIPContext;
