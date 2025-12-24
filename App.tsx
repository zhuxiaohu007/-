
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChristmasTreeScene from './components/ChristmasTreeScene';
import UIOverlay from './components/UIOverlay';
import LoadingScreen from './components/LoadingScreen';
import { AppMode } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Handle 'H' key for UI toggling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setUiVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoaded = useCallback(() => {
    setLoading(false);
  }, []);

  const handlePhotoUpload = useCallback((imageUrl: string) => {
    setPhotos(prev => [...prev, imageUrl]);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {loading && <LoadingScreen />}
      
      <ChristmasTreeScene 
        mode={mode} 
        onLoaded={handleLoaded} 
        onGestureChange={setMode}
        uploadedPhotos={photos}
      />
      
      <div className={`transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <UIOverlay 
          mode={mode} 
          onModeChange={setMode} 
          onPhotoUpload={handlePhotoUpload} 
        />
      </div>
    </div>
  );
};

export default App;
